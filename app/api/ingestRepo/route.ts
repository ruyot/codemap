import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

// Mock Snowflake connection - replace with actual Snowflake SDK
interface SnowflakeConnection {
  execute: (query: string, binds?: any[]) => Promise<any>
}

// Mock RelationalAI connection
interface RelationalAIConnection {
  createGraph: (name: string, data: any) => Promise<any>
}

interface RepoMetadata {
  owner: string
  repo: string
  branch?: string
}

interface FileNode {
  path: string
  type: 'file' | 'directory'
  size?: number
  language?: string
  content?: string
  dependencies?: string[]
}

interface FunctionNode {
  name: string
  filePath: string
  startLine: number
  endLine: number
  parameters: string[]
  returnType?: string
  complexity?: number
}

interface DependencyEdge {
  from: string
  to: string
  type: 'import' | 'call' | 'inheritance'
  weight: number
}

interface AuthorInfo {
  name: string
  email: string
  commits: number
  linesAdded: number
  linesDeleted: number
  lastCommit: Date
}

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, branch = 'main' }: RepoMetadata = await request.json()
    
    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo are required' }, { status: 400 })
    }

    console.log(`Starting ingestion for ${owner}/${repo}`)

    // Initialize connections (mock for development)
    const snowflake = await initializeSnowflake()
    const relationalAI = await initializeRelationalAI()
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

    // Step 1: Parse repository file tree
    const fileTree = await parseFileTree(octokit, owner, repo, branch)
    
    // Step 2: Extract commit data
    const commitData = await extractCommitData(octokit, owner, repo, branch)
    
    // Step 3: Analyze code structure
    const codeAnalysis = await analyzeCodeStructure(fileTree)
    
    // Step 4: Load data into Snowflake tables
    await loadIntoSnowflake(snowflake, {
      repo: `${owner}/${repo}`,
      files: fileTree,
      functions: codeAnalysis.functions,
      dependencies: codeAnalysis.dependencies,
      authors: commitData.authors
    })
    
    // Step 5: Create RelationalAI graph index
    const graphIndex = await createRelationalAIGraph(relationalAI, {
      repo: `${owner}/${repo}`,
      nodes: [...fileTree, ...codeAnalysis.functions],
      edges: codeAnalysis.dependencies
    })

    return NextResponse.json({
      success: true,
      summary: {
        filesProcessed: fileTree.length,
        functionsExtracted: codeAnalysis.functions.length,
        dependenciesFound: codeAnalysis.dependencies.length,
        authorsAnalyzed: commitData.authors.length,
        graphNodesCreated: graphIndex.nodeCount,
        graphEdgesCreated: graphIndex.edgeCount
      },
      snowflakeTableIds: {
        files: 'CODEMAP_FILES',
        functions: 'CODEMAP_FUNCTIONS', 
        dependencies: 'CODEMAP_DEPENDENCIES',
        authors: 'CODEMAP_AUTHORS'
      },
      relationalAIGraphId: graphIndex.id
    })

  } catch (error) {
    console.error('Repository ingestion failed:', error)
    return NextResponse.json({ 
      error: 'Failed to ingest repository',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function initializeSnowflake(): Promise<SnowflakeConnection> {
  // Mock implementation - replace with actual Snowflake connection
  return {
    execute: async (query: string, binds?: any[]) => {
      console.log('Snowflake Query:', query, binds)
      return { success: true, rowCount: binds?.length || 0 }
    }
  }
}

async function initializeRelationalAI(): Promise<RelationalAIConnection> {
  // Mock implementation - replace with actual RelationalAI connection
  return {
    createGraph: async (name: string, data: any) => {
      console.log('RelationalAI Graph:', name, data)
      return { 
        id: `graph-${Date.now()}`,
        nodeCount: data.nodes?.length || 0,
        edgeCount: data.edges?.length || 0
      }
    }
  }
}

async function parseFileTree(
  octokit: Octokit, 
  owner: string, 
  repo: string, 
  branch: string
): Promise<FileNode[]> {
  try {
    const { data: tree } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true'
    })

    const fileNodes: FileNode[] = []

    for (const item of tree.tree) {
      if (item.path && item.type) {
        const node: FileNode = {
          path: item.path,
          type: item.type as 'file' | 'directory',
          size: item.size
        }

        // Determine language from file extension
        if (node.type === 'file') {
          node.language = getLanguageFromPath(node.path)
          
          // For code files, fetch content and analyze dependencies
          if (isCodeFile(node.path)) {
            try {
              const { data: fileData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: item.path!
              })

              if ('content' in fileData) {
                node.content = Buffer.from(fileData.content, 'base64').toString('utf-8')
                node.dependencies = extractDependencies(node.content, node.language!)
              }
            } catch (error) {
              console.warn(`Failed to fetch content for ${item.path}:`, error)
            }
          }
        }

        fileNodes.push(node)
      }
    }

    return fileNodes
  } catch (error) {
    console.error('Failed to parse file tree:', error)
    return []
  }
}

async function extractCommitData(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
) {
  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: 100
    })

    const authorMap = new Map<string, AuthorInfo>()

    for (const commit of commits) {
      const author = commit.commit.author
      if (!author?.email) continue

      const key = author.email
      if (!authorMap.has(key)) {
        authorMap.set(key, {
          name: author.name || 'Unknown',
          email: author.email,
          commits: 0,
          linesAdded: 0,
          linesDeleted: 0,
          lastCommit: new Date(author.date || Date.now())
        })
      }

      const authorInfo = authorMap.get(key)!
      authorInfo.commits++
      
      // Update last commit date
      const commitDate = new Date(author.date || Date.now())
      if (commitDate > authorInfo.lastCommit) {
        authorInfo.lastCommit = commitDate
      }

      // Get commit stats
      try {
        const { data: commitDetail } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: commit.sha
        })

        if (commitDetail.stats) {
          authorInfo.linesAdded += commitDetail.stats.additions || 0
          authorInfo.linesDeleted += commitDetail.stats.deletions || 0
        }
      } catch (error) {
        console.warn(`Failed to get commit stats for ${commit.sha}:`, error)
      }
    }

    return {
      authors: Array.from(authorMap.values())
    }
  } catch (error) {
    console.error('Failed to extract commit data:', error)
    return { authors: [] }
  }
}

async function analyzeCodeStructure(fileNodes: FileNode[]) {
  const functions: FunctionNode[] = []
  const dependencies: DependencyEdge[] = []

  for (const file of fileNodes) {
    if (file.type === 'file' && file.content && file.language) {
      // Extract functions from file content
      const fileFunctions = extractFunctions(file.content, file.path, file.language)
      functions.push(...fileFunctions)

      // Create dependency edges
      if (file.dependencies) {
        for (const dep of file.dependencies) {
          dependencies.push({
            from: file.path,
            to: dep,
            type: 'import',
            weight: 1
          })
        }
      }
    }
  }

  return { functions, dependencies }
}

async function loadIntoSnowflake(
  snowflake: SnowflakeConnection,
  data: {
    repo: string
    files: FileNode[]
    functions: FunctionNode[]
    dependencies: DependencyEdge[]
    authors: AuthorInfo[]
  }
) {
  // Create tables if they don't exist
  await snowflake.execute(`
    CREATE TABLE IF NOT EXISTS CODEMAP_FILES (
      repo VARCHAR(255),
      path VARCHAR(1000),
      type VARCHAR(20),
      size INTEGER,
      language VARCHAR(50),
      dependencies ARRAY,
      ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await snowflake.execute(`
    CREATE TABLE IF NOT EXISTS CODEMAP_FUNCTIONS (
      repo VARCHAR(255),
      name VARCHAR(255),
      file_path VARCHAR(1000),
      start_line INTEGER,
      end_line INTEGER,
      parameters ARRAY,
      return_type VARCHAR(100),
      complexity INTEGER,
      ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await snowflake.execute(`
    CREATE TABLE IF NOT EXISTS CODEMAP_DEPENDENCIES (
      repo VARCHAR(255),
      from_path VARCHAR(1000),
      to_path VARCHAR(1000),
      type VARCHAR(50),
      weight INTEGER,
      ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await snowflake.execute(`
    CREATE TABLE IF NOT EXISTS CODEMAP_AUTHORS (
      repo VARCHAR(255),
      name VARCHAR(255),
      email VARCHAR(255),
      commits INTEGER,
      lines_added INTEGER,
      lines_deleted INTEGER,
      last_commit TIMESTAMP,
      ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  // Insert data
  for (const file of data.files) {
    await snowflake.execute(
      'INSERT INTO CODEMAP_FILES (repo, path, type, size, language, dependencies) VALUES (?, ?, ?, ?, ?, ?)',
      [data.repo, file.path, file.type, file.size, file.language, JSON.stringify(file.dependencies)]
    )
  }

  for (const func of data.functions) {
    await snowflake.execute(
      'INSERT INTO CODEMAP_FUNCTIONS (repo, name, file_path, start_line, end_line, parameters, return_type, complexity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.repo, func.name, func.filePath, func.startLine, func.endLine, JSON.stringify(func.parameters), func.returnType, func.complexity]
    )
  }

  for (const dep of data.dependencies) {
    await snowflake.execute(
      'INSERT INTO CODEMAP_DEPENDENCIES (repo, from_path, to_path, type, weight) VALUES (?, ?, ?, ?, ?)',
      [data.repo, dep.from, dep.to, dep.type, dep.weight]
    )
  }

  for (const author of data.authors) {
    await snowflake.execute(
      'INSERT INTO CODEMAP_AUTHORS (repo, name, email, commits, lines_added, lines_deleted, last_commit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.repo, author.name, author.email, author.commits, author.linesAdded, author.linesDeleted, author.lastCommit]
    )
  }
}

async function createRelationalAIGraph(
  relationalAI: RelationalAIConnection,
  data: {
    repo: string
    nodes: any[]
    edges: DependencyEdge[]
  }
) {
  return await relationalAI.createGraph(`codemap-${data.repo.replace('/', '-')}`, {
    nodes: data.nodes.map(node => ({
      id: node.path || node.name,
      type: node.type || 'function',
      properties: node
    })),
    edges: data.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      type: edge.type,
      weight: edge.weight
    }))
  })
}

// Helper functions
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    'ts': 'typescript', 'tsx': 'typescript',
    'js': 'javascript', 'jsx': 'javascript',
    'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c',
    'cs': 'csharp', 'php': 'php', 'rb': 'ruby', 'go': 'go',
    'rs': 'rust', 'swift': 'swift', 'kt': 'kotlin'
  }
  return langMap[ext || ''] || 'unknown'
}

function isCodeFile(path: string): boolean {
  const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt']
  const ext = path.split('.').pop()?.toLowerCase()
  return codeExtensions.includes(ext || '')
}

function extractDependencies(content: string, language: string): string[] {
  const dependencies: string[] = []
  
  // Simple regex patterns for different languages
  const patterns: Record<string, RegExp[]> = {
    typescript: [
      /import.*from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /require\(['"]([^'"]+)['"]\)/g
    ],
    javascript: [
      /import.*from\s+['"]([^'"]+)['"]/g,
      /require\(['"]([^'"]+)['"]\)/g
    ],
    python: [
      /from\s+(\S+)\s+import/g,
      /import\s+(\S+)/g
    ]
  }

  const langPatterns = patterns[language] || []
  
  for (const pattern of langPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      dependencies.push(match[1])
    }
  }

  return [...new Set(dependencies)] // Remove duplicates
}

function extractFunctions(content: string, filePath: string, language: string): FunctionNode[] {
  const functions: FunctionNode[] = []
  
  // Simple function extraction for TypeScript/JavaScript
  if (language === 'typescript' || language === 'javascript') {
    const functionRegex = /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/g
    const lines = content.split('\n')
    
    let match
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2]
      const startIndex = match.index
      const lineNumber = content.substring(0, startIndex).split('\n').length
      
      functions.push({
        name: functionName,
        filePath,
        startLine: lineNumber,
        endLine: lineNumber + 10, // Approximate
        parameters: [], // Would need more sophisticated parsing
        complexity: 1 // Would need complexity analysis
      })
    }
  }

  return functions
}

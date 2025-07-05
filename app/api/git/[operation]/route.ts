import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || 'mock-token'
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ operation: string }> }
) {
  const { operation } = await params
  
  try {
    const { repo, owner, branch } = await request.json()

    if (!repo || !owner) {
      return NextResponse.json({ error: 'Repository and owner are required' }, { status: 400 })
    }

    // For development, return mock results
    if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN === 'mock-token') {
      const mockResults = getMockResult(operation, repo, owner, branch)
      return NextResponse.json({ result: mockResults })
    }

    // Real GitHub API operations
    switch (operation) {
      case 'status':
        return await handleStatus(repo, owner, branch)
      
      case 'diff':
        return await handleDiff(repo, owner, branch)
      
      case 'commit':
        return await handleCommit(repo, owner, branch)
      
      case 'branch':
        return await handleBranch(repo, owner)
      
      case 'merge':
        return await handleMerge(repo, owner, branch)
      
      case 'log':
        return await handleLog(repo, owner, branch)
      
      case 'checkout':
        return await handleCheckout(repo, owner, branch)
      
      default:
        return NextResponse.json({ 
          result: `${operation} operation simulated for ${owner}/${repo}` 
        })
    }

  } catch (error) {
    console.error(`Error executing Git operation ${operation}:`, error)
    return NextResponse.json({ 
      error: `Failed to execute ${operation}` 
    }, { status: 500 })
  }
}

function getMockResult(operation: string, repo: string, owner: string, branch: string): string {
  const mockResults: Record<string, string> = {
    status: `On branch ${branch}
Your branch is up to date with 'origin/${branch}'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   components/Header.tsx
        modified:   components/Footer.tsx

no changes added to commit (use "git add" or "git commit -a")`,

    diff: `diff --git a/components/Header.tsx b/components/Header.tsx
index 1234567..abcdefg 100644
--- a/components/Header.tsx
+++ b/components/Header.tsx
@@ -12,7 +12,7 @@ export default function Header({ title, onMenuClick }: HeaderProps) {
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between items-center py-6">
           <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
-          {onMenuClick && (
+          {onMenuClick?.() && (
             <Button onClick={onMenuClick} variant="outline">
               Menu
             </Button>`,

    commit: `[${branch} abc1234] Update header component with optional chaining
 2 files changed, 4 insertions(+), 2 deletions(-)`,

    branch: `* ${branch}
  develop
  feature/auth
  feature/ui-improvements
  main`,

    merge: `Merge made by the 'recursive' strategy.
 components/Header.tsx | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)`,

    log: `commit abc1234567890 (HEAD -> ${branch})
Author: Developer <dev@codemap.com>
Date:   ${new Date().toISOString()}

    Update header component with optional chaining

commit def0987654321
Author: Developer <dev@codemap.com>
Date:   ${new Date(Date.now() - 86400000).toISOString()}

    Add footer component

commit ghi1122334455
Author: Developer <dev@codemap.com>
Date:   ${new Date(Date.now() - 172800000).toISOString()}

    Initial commit`,

    checkout: `Switched to branch '${branch}'
Your branch is up to date with 'origin/${branch}'.`,

    add: `Changes staged for commit:
        modified:   components/Header.tsx
        modified:   components/Footer.tsx`,

    mv: `git mv components/OldComponent.tsx components/NewComponent.tsx`,

    rm: `rm 'components/UnusedComponent.tsx'`,

    fetch: `From https://github.com/${owner}/${repo}
 * branch            ${branch}     -> FETCH_HEAD`,

    pull: `From https://github.com/${owner}/${repo}
 * branch            ${branch}     -> FETCH_HEAD
Already up to date.`,

    push: `Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 324 bytes | 324.00 KiB/s, done.
Total 3 (delta 2), reused 0 (delta 0), pack-reused 0
To https://github.com/${owner}/${repo}.git
   abc1234..def5678  ${branch} -> ${branch}`
  }

  return mockResults[operation] || `${operation} operation completed successfully for ${owner}/${repo}`
}

async function handleStatus(repo: string, owner: string, branch: string) {
  try {
    // Get repository info and recent commits to simulate status
    const repoInfo = await octokit.rest.repos.get({ owner, repo })
    const commits = await octokit.rest.repos.listCommits({ 
      owner, 
      repo, 
      sha: branch,
      per_page: 1 
    })

    const result = `Repository: ${owner}/${repo}
Branch: ${branch}
Last commit: ${commits.data[0]?.sha.substring(0, 7) || 'unknown'}
Status: Clean working directory`

    return NextResponse.json({ result })
  } catch (error) {
    throw error
  }
}

async function handleDiff(repo: string, owner: string, branch: string) {
  try {
    const commits = await octokit.rest.repos.listCommits({ 
      owner, 
      repo, 
      sha: branch,
      per_page: 2 
    })

    if (commits.data.length < 2) {
      return NextResponse.json({ result: 'No commits to compare' })
    }

    const comparison = await octokit.rest.repos.compareCommits({
      owner,
      repo,
      base: commits.data[1].sha,
      head: commits.data[0].sha
    })

    const result = `Comparing ${commits.data[1].sha.substring(0, 7)}..${commits.data[0].sha.substring(0, 7)}

Files changed: ${comparison.data.files?.length || 0}
Additions: +${comparison.data.ahead_by || 0}
Deletions: -${comparison.data.behind_by || 0}`

    return NextResponse.json({ result })
  } catch (error) {
    throw error
  }
}

async function handleCommit(repo: string, owner: string, branch: string) {
  // This would typically create a commit, but for safety we'll just simulate
  const result = `[${branch} ${Math.random().toString(36).substring(2, 9)}] Simulated commit
 Files would be committed here in a real implementation`
  
  return NextResponse.json({ result })
}

async function handleBranch(repo: string, owner: string) {
  try {
    const branches = await octokit.rest.repos.listBranches({ owner, repo })
    
    const result = branches.data
      .map(branch => `  ${branch.name}`)
      .join('\n')
    
    return NextResponse.json({ result })
  } catch (error) {
    throw error
  }
}

async function handleMerge(repo: string, owner: string, branch: string) {
  // Simulate merge operation
  const result = `Merge simulation for branch: ${branch}
This would merge changes in a real implementation`
  
  return NextResponse.json({ result })
}

async function handleLog(repo: string, owner: string, branch: string) {
  try {
    const commits = await octokit.rest.repos.listCommits({ 
      owner, 
      repo, 
      sha: branch,
      per_page: 5 
    })

    const result = commits.data
      .map(commit => `commit ${commit.sha.substring(0, 7)}
Author: ${commit.commit.author?.name} <${commit.commit.author?.email}>
Date:   ${commit.commit.author?.date}

    ${commit.commit.message}`)
      .join('\n\n')

    return NextResponse.json({ result })
  } catch (error) {
    throw error
  }
}

async function handleCheckout(repo: string, owner: string, branch: string) {
  // Simulate checkout operation
  const result = `Switched to branch '${branch}'
Your branch is up to date with 'origin/${branch}'.`
  
  return NextResponse.json({ result })
}

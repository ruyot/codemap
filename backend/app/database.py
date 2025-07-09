from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
    
    async def get_api_usage(self, user_id: str):
        """Get API usage count for a user"""
        try:
            response = self.client.table('api_usage').select('count').eq('user_id', user_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching API usage: {e}")
            return None
    
    async def increment_api_usage(self, user_id: str):
        """Increment API usage count for a user"""
        try:
            # First try to get existing record
            existing = await self.get_api_usage(user_id)
            
            if existing:
                # Update existing record
                response = self.client.table('api_usage').update({
                    'count': existing['count'] + 1
                }).eq('user_id', user_id).execute()
            else:
                # Insert new record
                response = self.client.table('api_usage').insert({
                    'user_id': user_id,
                    'count': 1
                }).execute()
            
            return response.data
        except Exception as e:
            logger.error(f"Error incrementing API usage: {e}")
            return None
    
    async def create_project(self, name: str, user_id: str):
        """Create a new project"""
        try:
            response = self.client.table('projects').insert({
                'name': name,
                'user_id': user_id
            }).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            return None
    
    async def get_project(self, project_id: str):
        """Get project by ID"""
        try:
            response = self.client.table('projects').select('*').eq('id', project_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching project: {e}")
            return None
    
    async def create_file(self, project_id: str, name: str, path: str, content: str, file_type: str = 'file'):
        """Create a new file record"""
        try:
            response = self.client.table('files').insert({
                'project_id': project_id,
                'name': name,
                'type': file_type,
                'path': path,
                'content': content,
                'created_at': 'now()',
                'updated_at': 'now()'
            }).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating file: {e}")
            return None
    
    async def get_project_files(self, project_id: str):
        """Get all files for a project"""
        try:
            response = self.client.table('files').select('*').eq('project_id', project_id).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching project files: {e}")
            return []
    
    async def update_file(self, file_id: str, content: str):
        """Update file content"""
        try:
            response = self.client.table('files').update({
                'content': content,
                'updated_at': 'now()'
            }).eq('id', file_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error updating file: {e}")
            return None
    
    async def delete_file(self, file_id: str):
        """Delete a file"""
        try:
            response = self.client.table('files').delete().eq('id', file_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return False

# Global database instance
db = SupabaseClient()

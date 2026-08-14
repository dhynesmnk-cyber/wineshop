import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemaTypes';
import { deskStructure } from './sanity/structure';

export default defineConfig({
  name: 'wine-drop-cms',
  title: 'Wine Drop CMS',
  
  projectId: process.env.SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.SANITY_DATASET || 'production',
  
  plugins: [
    structureTool({ structure: deskStructure }),
    visionTool(),
  ],
  
  schema: {
    types: schemaTypes,
  },
  
  document: {
    // Custom actions for sync operations
    actions: (prev) => [
      ...prev,
      // Would add custom "Trigger Sync" action here
    ],
  },
  
  // Role-based access control
  currentUser: {
    enabled: true,
  },
});

import type {StructureResolver} from 'sanity/structure';

export const deskStructure: StructureResolver = (S, context) =>
  S.list()
    .title('Wine Drop CMS')
    .items([
      // Products section
      S.listItem()
        .title('Products')
        .schemaType('product')
        .child(
          S.documentList()
            .schemaType('product')
            .title('All Products')
            .filter('_type == "product"')
        ),
      
      // Suppliers section
      S.listItem()
        .title('Suppliers')
        .schemaType('supplier')
        .child(
          S.documentList()
            .schemaType('supplier')
            .title('All Suppliers')
            .filter('_type == "supplier"')
        ),
      
      // Orders section
      S.listItem()
        .title('Orders')
        .schemaType('order')
        .child(
          S.documentList()
            .schemaType('order')
            .title('All Orders')
            .filter('_type == "order"')
            .orderBy('createdAt desc')
        ),
      
      // Sync Logs section
      S.listItem()
        .title('Sync Logs')
        .schemaType('syncLog')
        .child(
          S.documentList()
            .schemaType('syncLog')
            .title('All Sync Logs')
            .filter('_type == "syncLog"')
            .orderBy('timestamp desc')
        ),
      
      S.divider(),
      
      // Blog section
      S.listItem()
        .title('Blog')
        .child(
          S.list()
            .title('Blog Management')
            .items([
              S.listItem()
                .title('Posts')
                .schemaType('blogPost')
                .child(
                  S.documentList()
                    .schemaType('blogPost')
                    .title('All Posts')
                    .filter('_type == "blogPost"')
                    .orderBy('publishedAt desc')
                ),
              S.listItem()
                .title('Categories')
                .schemaType('category')
                .child(
                  S.documentList()
                    .schemaType('category')
                    .title('All Categories')
                    .filter('_type == "category"')
                ),
              S.listItem()
                .title('Authors')
                .schemaType('author')
                .child(
                  S.documentList()
                    .schemaType('author')
                    .title('All Authors')
                    .filter('_type == "author"')
                ),
            ])
        ),
      
      S.divider(),
      
      // Settings
      S.listItem()
        .title('Site Settings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
    ]);

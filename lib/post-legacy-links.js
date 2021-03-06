export default async function getLegacyLinks(post) {
  if (!(post.published && post.date)) return [];
  return {
    from: [
      // permalink
      `/post.aspx?id=${post.id.toLowerCase()}`,
      
      // stub link
      `/post/${post.date.toJSON().substr(0,10).replace(/\-/g,'/')}/${encodeURIComponent(post.oldSlug.trim())}.aspx`.toLowerCase()
    ],
    to: `/post/${post.date.toJSON().substr(0,10).replace(/\-/g,'/')}/${encodeURIComponent(post.slug.trim())}/`.toLowerCase()
  }; 

}
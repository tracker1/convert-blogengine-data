import path from 'path';
import fs from 'mz/fs';

var _posts = null;
export default async function getPostList() {
  if (_posts) return _posts;
  
  var fp = path.resolve(__dirname, '../input/posts')
  var posts = await fs.readdir(fp);
  
  return _posts = posts.map(p => p.replace(/\.xml$/,''));
}
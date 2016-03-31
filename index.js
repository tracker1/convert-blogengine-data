import path from 'path';
import fs from 'mz/fs';
import getPostList from './lib/post-list';
import readPost from './lib/post-read';
import writePost from './lib/post-write';
import getLegacyLinks from './lib/post-legacy-links';

async function main() {
  try {
    //var cats = await getCategories();
    var cats = [];
    var tags = [];
    var maplinks = [];
    var posts = await getPostList();
    for (var p of posts) {
      var post = await readPost(p);
      tags = unique(tags.concat(post.tags));
      cats = unique(cats.concat(post.categories));
      maplinks = maplinks.concat(await getLegacyLinks(post));
      await writePost(post);
    }
    
    //console.log({tags,cats,maplinks});
    if (!(await fs.exists(path.resolve(__dirname,'../output')))) {
      await fs.mkdir(path.resolve(__dirname,'../output'));
    }
    await fs.writeFile(path.resolve('../output/legacy-post-paths.json'), JSON.stringify(maplinks, null, 2), 'utf8');
    
  } catch(err) {
    console.error(err.message, err.stack.replace(/\\n/,'\n'));
  }
}

function unique(arr) {
  return arr.filter((o,i) => arr.lastIndexOf(o) == i);
} 

main();
import path from 'path';
import fs from 'mz/fs';
import yaml from 'js-yaml';

export default async function writePost(post) {
  var content = post.content;
  var files = post.files;
  var hasFiles = files && files.length;
  
  var h = {...post};
  
  //if do not publush - delete publish date
  if (h.published && h.date) {
    delete h.published;
  } else {
    h.published = false;
    h.date = null;
  }
  
  //delete unused legacy bits
  //delete h.id;
  //delete h.oldSlug;
  
  //don't include content in headers
  delete h.content;
  delete h.files;
  
  //add layout
  //h.layout = 'post';
  
  var y = h.date ? h.date.getFullYear() : '_draft';
  var ymd = h.date ? h.date.toJSON().substr(0,10) : '0000';
  var fp = path.resolve(__dirname, `../output/posts/${y}/${ymd}-${h.slug}/index.md`);
  var article = [
    '---',
    yaml.safeDump(h).trim(),
    '---\n',
    content
  ].join('\n');
  
  await createPath(hasFiles ? fp.replace('index.md','files/file') : fp);
  await fs.writeFile(fp, article, 'utf8');
  if (hasFiles) await writeFiles(files, fp.replace('index.md','files'));
}

async function writeFiles(files, fp) {
  for (var f of files) {
    var {url,file} = f;
    var source = path.resolve(__dirname,'../input/files', url);
    var target = path.resolve(fp, file);
    //console.log('copyfile 1\n  ', source, '\n  ', target);
    await copyFile(source, target);
  }
}

function copyFile(source, target) {
  //console.log('copyfile\n  ', source, '\n  ', target);
  return new Promise(function(resolve, reject) {
    var rd = fs.createReadStream(source);
    rd.on('error', reject);
    var wr = fs.createWriteStream(target);
    wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  });
}

async function createPath(fp) {
  var top = path.resolve(__dirname,'..');
  var paths = [];
  while (fp != top) paths.push(fp = path.dirname(fp));
  
  paths.pop(); //remove base
  while (paths.length) {
    fp = paths.pop();
    var exists = await fs.exists(fp);
    if (!exists) {
      await fs.mkdir(fp);
    }
  }
}
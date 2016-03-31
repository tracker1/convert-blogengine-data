import path from 'path';
import fs from 'mz/fs';
import cheerio from 'cheerio';
import getCategories from './categories';

export default async function readPost(id) {
  var cats = await getCategories();
  var fp = path.resolve(__dirname, `../input/posts/${id}.xml`);
  var data = await fs.readFile(fp,'utf8');
  var $ = cheerio.load(data, { xmlMode: true });
  
  return {
    id,
    author: {
      name: "Michael J. Ryan",
      email: "tracker1@gmail.com" 
    },
    oldSlug: $('slug').text(), 
    slug: $('slug').text().replace(/[^a-z0-9]+/ig,' ').trim().replace(/\s+/g,'-').toLowerCase(),
    title: $('title').text(),
    description: $('description').text(),
    content: $('content').text().replace(/(\r\n|\r|\n)/g,'\n'),
    published: $('ispublished').text() == 'True',
    date: new Date($('pubDate').text().replace(/\s/,'T') + 'Z') || null,
    modified: new Date($('pubDate').text().replace(/\s/,'T') + 'Z') || null,
    tags: Array.from($('tags > tag').map((i,t) => $(t).text())),
    categories: Array.from($('categories > category').map((i,c) => cats[$(c).text()]))
  };
}
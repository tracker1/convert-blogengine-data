import path from 'path';
import fs from 'mz/fs';
import cheerio from 'cheerio';

export default async function getCategories() {
  var fp = path.resolve(__dirname,'../input/categories.xml');
  var data = await fs.readFile(fp,'utf8');
  var ret = {};
  var $ = cheerio.load(data);
  var cats = Array.from(
    $('category')
    .map((i,c) => {
        c = $(c);
        return {id:c.attr('id'), text:c.text()};
    })
  )
  .reduce((cats, c) => {
      cats[c.id] = c.text;
      return cats;
  },{});

  return cats;
}
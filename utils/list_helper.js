// eslint-disable-next-line import/no-extraneous-dependencies
const _ = require('lodash');
const { info } = require('./logger');
// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => 1;

const totalLikes = (array) => _.sumBy(array, 'likes');

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }
  const result = blogs.reduce((accumulator, currentblog) => {
    if (currentblog.likes > (accumulator ? accumulator.likes : 0)) {
      return currentblog;
    }
    return accumulator;
  }, null);
  return result;
};

const mostBlogs = (blogs) => {
  const result = _.countBy(blogs, (blog) => blog.author);
  info(result);
  const maxAuthor = Object.keys(result).reduce((accumulator, currentAuthor) => (
    result[accumulator] > result[currentAuthor] ? accumulator : currentAuthor
  ), '');
  return {
    author: maxAuthor,
    blogs: result[maxAuthor],
  };
};

const mostLikes = (blogs) => {
  const result = _.groupBy(blogs, 'author');
  info(result);

  const authorWithMostLikes = _.maxBy(Object.keys(result), (author) => _.sumBy(result[author], 'likes'));
  const sumLikes = totalLikes(result[authorWithMostLikes], 'likes');

  return {
    author: authorWithMostLikes,
    likes: sumLikes,
  };
};

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes,
};

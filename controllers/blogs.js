/* eslint-disable no-underscore-dangle */
// To define routehandling
const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

// eslint-disable-next-line consistent-return
blogsRouter.post('/', async (request, response) => {
  const {
    title, url, likes, userId, author,
  } = request.body;
  const user = await User.findById(userId);
  if (
    (url === undefined || url === null) || (title === undefined || title === null)
  ) {
    return response.status(400).json({ error: 'Title and URL are required' });
  }
  const blogData = {
    title,
    url,
    likes: likes === undefined || likes === null ? 0 : likes,
    user: user.id,
    author,
  };
  const newblog = new Blog(blogData);
  const result = await newblog.save();
  user.blogs = user.blogs.concat(result._id);
  await user.save();

  response.status(201).json(result);
});

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

blogsRouter.put('/:id', async (request, response) => {
  const { id } = request.params;
  const { likes } = request.body;

  await Blog.findByIdAndUpdate(id, { likes }, { new: true });
  response.json(200).end();
});

module.exports = blogsRouter;

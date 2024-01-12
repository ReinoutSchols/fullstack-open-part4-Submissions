/* eslint-disable no-underscore-dangle */
// To define routehandling
const blogsRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const User = require('../models/user');
const { errorHandler, getTokenFrom } = require('../utils/middleware');

blogsRouter.use(getTokenFrom);
blogsRouter.use(errorHandler);

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

// eslint-disable-next-line consistent-return
blogsRouter.post('/', async (request, response) => {
  const {
    title, url, likes, author,
  } = request.body;
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }
  const user = await User.findById(decodedToken.id);

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
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }

  const blogId = request.params.id;
  const blog = await Blog.findById(blogId);

  if (!blog || blog.user.toString() !== decodedToken.id) {
    return response.status(404).json({ error: 'Blog not found' });
  }

  await Blog.findByIdAndDelete(blogId);
  response.status(204).end();
});

blogsRouter.put('/:id', async (request, response) => {
  const { id } = request.params;
  const { likes } = request.body;

  await Blog.findByIdAndUpdate(id, { likes }, { new: true });
  response.json(200).end();
});

module.exports = blogsRouter;

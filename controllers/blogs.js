/* eslint-disable prefer-destructuring */
/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
// To define routehandling
const blogsRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const middleware = require('../utils/middleware');
const Blog = require('../models/blog');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

// eslint-disable-next-line consistent-return
blogsRouter.post('/', middleware.getTokenFrom, middleware.userExtractor, async (request, response) => {
  const {
    title, url, likes, author,
  } = request.body;
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }
  const user = request.user;

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

blogsRouter.delete('/:id', middleware.getTokenFrom, middleware.userExtractor, async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }

  const blogId = request.params.id;
  const blog = await Blog.findById(blogId);

  if (!blog || blog.user.toString() !== request.user.id) {
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

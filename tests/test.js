/* eslint-disable import/order */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const helper = require('./test_helper');
const supertest = require('supertest');
const app = require('../app');

const api = supertest(app);
const Blog = require('../models/blog');
// eslint-disable-next-line object-curly-newline
const { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes } = require('../utils/list_helper');

// to reset blogs in DB on each test and do it with the blog scheme.
beforeEach(async () => {
  await Blog.deleteMany({});
  const blogPromises = helper.initialBlogs.map(async (blog) => {
    const blogObject = new Blog(blog);
    await blogObject.save();
  });

  await Promise.all(blogPromises);
}, 10000);

test('dummy returns one', () => {
  const result = dummy(helper.initialBlogs);
  expect(result).toBe(1);
});

describe('total likes', () => {
  test('when list has only one blog, equals the likes of that', () => {
    const result = totalLikes(helper.initialBlogs);
    console.log(`total likes = ${result}`);
    expect(result).toBe(36);
  });
});

describe('favorite blog', () => {
  test('to get the blog with most likes', () => {
    const result = favoriteBlog(helper.initialBlogs);
    console.log(`Most likes: ${result.likes}`);
    expect(result).toEqual(helper.initialBlogs[2]);
  });
});

describe('most Blogs', () => {
  test('Calculate the author with the most blogs and return this author and the count of blogs', () => {
    const result = mostBlogs(helper.initialBlogs);
    expect(result).toEqual({
      author: 'Robert C. Martin',
      blogs: 3,
    });
  }, 100000);
});

describe('most Likes', () => {
  test('Calculate the author with the most likes and return this author and the count of likes', () => {
    const result = mostLikes(helper.initialBlogs);
    expect(result).toEqual({
      author: 'Edsger W. Dijkstra',
      likes: 17,
    });
  });
});

describe('exercise 4.8', () => {
  test('blogs are returned as json with correct count', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
    expect(response.body).toHaveLength(helper.initialBlogs.length);
  }, 10000);
});

describe('exercise 4.9', () => {
  test('unique identifier property of all blogs is named id', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogPosts = response.body;
    blogPosts.forEach((blogPost) => {
      expect(blogPost.id).toBeDefined();
      console.log(blogPost.id);
    });
  }, 10000);
});

describe('exercise 4.10', () => {
  test('HTTP POST succesfully creates a new blog post', async () => {
    // creating blog item to test post
    const newBlog = {
      title: 'Posting blogs is cool',
      author: 'Reinout Schols',
      url: 'http://fullstackopen.com',
      likes: 100000,
      __v: 0,
    };
    // sending newBlog
    console.log('Making POST request to create a new blog post...');
    const postResponse = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    console.log('POST request successful. Retrieving blog list...');

    const newBlogResponse = postResponse.body;
    console.log(newBlogResponse);
    // getting all the blogs
    const response = await api.get('/api/blogs');
    const blogs = response.body;
    // logging new length
    console.log('Current blog list length:', response.body.length);

    expect(blogs).toHaveLength(helper.initialBlogs.length + 1);
    expect(blogs).toContainEqual(newBlogResponse);
  }, 10000);
});

describe('exercise 4.11', () => {
  test('if like property is missing, the value will default to 0', async () => {
    // defining new blog without like property:
    const newBlog = {
      title: 'defaulting values is the best',
      author: 'Reinout Schols',
      url: 'http://fullstackopen.com',
      __v: 0,
    };
    const postResponse = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    console.log('POST request successful. Retrieving blog list...');

    const newBlogResponse = postResponse.body;
    console.log(`Likes of non-defined like property: ${newBlogResponse.likes}`);
    expect(newBlogResponse.likes).toBe(0);
  }, 10000);
});

describe('exercise 4.12', () => {
  test('if url or title is missing, return 400 bad request', async () => {
    // For no URL
    const newBlog = {
      author: 'Reinout Schols',
      title: 'papi',
      likes: 5500,
      __v: 0,
    };
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400);
    // For no title
    const newBlog2 = {
      author: 'Reinout Schols',
      url: 'www.nice.com',
      likes: 5500,
      v: 0,
    };
    await api
      .post('/api/blogs')
      .send(newBlog2)
      .expect(400);
  }, 10000);
});

describe('exercise 4.13', () => {
  test('deleting single blog post', async () => {
    const blogsStart = await helper.blogsInDb();
    const blogDelete = blogsStart[0];
    console.log('Making Delete request by ID...');
    await api
      .delete(`/api/blogs/${blogDelete.id}`)
      .expect(204);
    console.log('Blog deleted');
    const blogsEnd = await helper.blogsInDb();

    expect(blogsEnd).toHaveLength(helper.initialBlogs.length - 1);
  }, 10000);
});

describe('exercise 4.14', () => {
  test.only('updating the likes of a single blog post', async () => {
    const blogsStart = await helper.blogsInDb();
    const blogUpdate = blogsStart[0];
    const updatedLikes = 77;
    console.log('Making put request by ID...');
    await api
      .put(`/api/blogs/${blogUpdate.id}`)
      .send({ likes: updatedLikes })
      .expect(200);
    console.log('Updated likes by id');
    const blogsEnd = await helper.blogsInDb();

    expect(blogsEnd[0].likes).toBe(77);
  }, 10000);
});

afterAll(async () => {
  await mongoose.connection.close();
}, 10000);

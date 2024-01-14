/* eslint-disable import/newline-after-import */
/* eslint-disable import/order */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const helper = require('./test_helper');
const supertest = require('supertest');
const app = require('../app');
const bcryptjs = require('bcryptjs');
const api = supertest(app);
const User = require('../models/user');
const Blog = require('../models/blog');
// eslint-disable-next-line object-curly-newline
const { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes } = require('../utils/list_helper');

// creating test user with token
let token;
beforeAll(async () => {
  const user = {
    username: 'testuser',
    password: 'testpassword',
  };
  await api.post('/api/users').send(user);
  // Log in
  const loginResponse = await api.post('/api/login').send({
    username: 'testuser',
    password: 'testpassword',
  });
  // Store the token for later use
  token = loginResponse.body.token;
});

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
  }, 10000);
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
  test('HTTP POST succesfully creates a new blog post when token is provided', async () => {
    console.log(token);
    expect(token).toBeDefined();
    // creating blog item to test post
    const newBlog = {
      title: 'Posting blogs is cool',
      author: 'Reinout Schols',
      url: 'http://fullstackopen.com',
      likes: 100000,
    };
    // posting newBlog
    console.log('Making POST request to create a new blog post...');
    const postResponse = await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    console.log('POST request successful.');

    const newBlogResponse = {
      ...newBlog,
      user: {
        username: 'testuser',
        id: '65a3abe903be69b624c3b8cc',
      },
      id: postResponse.body.id,
    };
    console.log(newBlogResponse);
    // getting all the blogs
    const response = await api.get('/api/blogs');
    const blogs = response.body;
    // logging new length
    console.log('Current blog list length:', response.body.length);
    console.log(blogs);
    expect(blogs).toHaveLength(helper.initialBlogs.length + 1);
    expect(blogs).toEqual(expect.arrayContaining([expect.objectContaining(newBlogResponse)]));
  }, 10000);
});

describe('exercise 4.23', () => {
  test('HTTP POST returns 401 error when creating a new blog without providing token', async () => {
    // creating blog item to test post
    const newBlog = {
      title: 'Posting blogs is cool',
      author: 'Reinout Schols',
      url: 'http://fullstackopen.com',
      likes: 100000,
    };
    // posting newBlog
    console.log('Making POST request to create a new blog post with token missing...');
    const postResponse = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401);

    expect(postResponse.body).toHaveProperty('error', 'Token missing');
  }, 10000);
});
describe('exercise 4.11', () => {
  test('if like property of blog is missing, the value will default to 0', async () => {
    // defining new blog without like property:
    const newBlog = {
      title: 'defaulting values is the best',
      author: 'Reinout Schols',
      url: 'http://fullstackopen.com',
      __v: 0,
    };
    const postResponse = await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    console.log('POST request successful.');

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
    const noUrl = await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400);
    console.log(noUrl.body.error);
    // For no title
    const newBlog2 = {
      author: 'Reinout Schols',
      url: 'www.nice.com',
      likes: 5500,
      v: 0,
    };
    const noTitle = await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlog2)
      .expect(400);
    console.log(noTitle.body.error);
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
  test('updating the likes of a single blog post', async () => {
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

// User testing

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcryptjs.hash('sekret', 10);
    const user = new User({ username: 'uniquename', passwordHash });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'uniquename',
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('Username must be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);
  }, 10000);

  test('Length of userName and password has to be longer than 2', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'sh',
      name: 'papi',
      password: 'damn',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toEqual('Username must be at least 3 characters long');
    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);

    const newUser2 = {
      username: 'difficultchapter',
      name: 'papi',
      password: 'YE',
    };

    const result2 = await api
      .post('/api/users')
      .send(newUser2)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result2.body.error).toEqual('Password must be at least 3 characters long');
  }, 10000);
});

afterAll(async () => {
  await mongoose.connection.close();
}, 10000);

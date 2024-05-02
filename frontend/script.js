let loggedIn = false;
let userId;

window.addEventListener('DOMContentLoaded', async () => {
    await fetchAndDisplayBlogPosts();
});


async function fetchAndDisplayBlogPosts() {
    try {
        const blogPostResponse = await fetch('/blogs/');
        if (!blogPostResponse.ok) {
            throw new Error('Failed to fetch blog posts');
        }
        const blogPosts = await blogPostResponse.json();

        //get all author details
        await Promise.all(blogPosts.map(async (blogPost) => {
            const authorResponse = await fetch(`/users/${blogPost.author}`);
            if (!authorResponse.ok) {
                throw new Error('Failed to fetch author details');
            }
            const authData = await authorResponse.json();
            blogPost.authorName = authData.name;
        }));

        //get all comment details
        await Promise.all(blogPosts.map(async (blogPost) => {
            await Promise.all(blogPost.comments.map(async (comment)=> {
                const userResponse = await fetch(`/users/${comment.user}`)
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch user details');
                }
                const userData = await userResponse.json();
                comment.userName = userData.name;
            }))

        }));

        await displayBlogPost(blogPosts);
    } catch (error) {
        console.error('Error fetching content', error);
    }
}

//function to display blog posts
async function displayBlogPost(blogPosts) {
    const blogPostContainer = document.getElementById('blogPosts');
    blogPostContainer.innerHTML = '';

    blogPosts.forEach(blogPost => {
        // const cardElement = document.createElement('div');
        //
        // const titleElement = document.createElement('h5');
        // titleElement.textContent = blogPost.title;
        // cardElement.appendChild(titleElement);
        //
        // const authorElement = document.createElement('p');
        // authorElement.textContent = blogPost.authorName;
        // cardElement.appendChild(authorElement);
        //
        // const contentElement = document.createElement('p');
        // contentElement.textContent = blogPost.content;
        // cardElement.appendChild(contentElement);
        //
        // const likesElement = document.createElement('p');
        // contentElement.textContent = `Likes: ${blogPost.likes}`;
        // cardElement.appendChild(likesElement);
        //
        // const commentsElement = document.createElement('ul');
        // blogPost.comments.forEach(comment => {
        //     const commentItem = document.createElement('li');
        //     commentItem.textContent = `${comment.userName}: ${comment.content}          ${comment.likes} Likes`;
        //     commentsElement.appendChild(commentItem);
        // });
        // cardElement.appendChild(commentsElement);
        //

        const cardElement = createBlogPostCard(blogPost);
        blogPostContainer.appendChild(cardElement);


    })
}

function createBlogPostCard(blogPost) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('blog-post-card');

    const titleElement = document.createElement('h5');
    titleElement.textContent = blogPost.title;

    const authorElement = document.createElement('p');
    authorElement.textContent = blogPost.authorName;

    const contentElement = document.createElement('p');
    contentElement.textContent = blogPost.content;

    const postLikesButton = createLikeButton(blogPost.likes);

    postLikesButton.addEventListener('click', async () => {
        if (blogPost.liked || !loggedIn) {
            //Do nothing
            return;
        }
        try {
            const response = await fetch(`blogs/like/${blogPost._id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error('Failed to like blog post');
            }

            blogPost.likes++;
            postLikesButton.querySelector('.likes-count').textContent = `${blogPost.likes}`;
            blogPost.liked = true;
        } catch (error) {
            console.error('Error: ', error.message);
        }
    });

    const commentsElement = createCommentsElement(blogPost);

    cardElement.appendChild(titleElement);
    cardElement.appendChild(authorElement);
    cardElement.appendChild(postLikesButton);
    cardElement.appendChild(contentElement);
    cardElement.appendChild(commentsElement);

    if (loggedIn) {
        const commentForm = createCommentForm(blogPost._id);
        cardElement.appendChild(commentForm);
    }

    return cardElement;
}

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
        const response = await fetch('/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username, password})
        });

        if (!response.ok) {
            throw new Error('Failed to login');
        }

        const data = await response.json();
        userId = data._id;
        loggedIn = true;

        console.log('Login Successful: ', data);


        document.getElementById('loginFormContainer').style.display = 'none';
        document.getElementById('blogFormContainer').style.display = 'block';

        document.getElementById('userGreeting').innerHTML = `<h4>Hello, ${data.name}</h4>`;

        await fetchAndDisplayBlogPosts();


    } catch (error) {
        console.error('Error: ', error.message);
        document.getElementById('validation').innerHTML = `<p>${error.message}</p>`
    } finally {
        event.target.reset();
    }
});

document.getElementById('blogPostForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const title = formData.get('postTitle');
    const content = formData.get('postContent');

    try {
        const response = await fetch('/blogs/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({title, content, author: userId})
        });

        if (!response.ok) {
            throw new Error('Failed to create blog post');
        }

        event.target.reset();
        await fetchAndDisplayBlogPosts();
        console.log('Blog post created successfully');
    } catch (error) {
        console.error('Error: ', error.message);

        const postValidation = document.getElementById('postValidation');
        postValidation.innerHTML = `<p>${error.message}</p>`;
    }
});

function createLikeButton(likes) {
    const likesButton = document.createElement('button');
    likesButton.classList.add('likes-button');

    const heartIcon = document.createElement('img');
    heartIcon.classList.add('heart-icon');
    heartIcon.src = 'resources/like.png';
    heartIcon.alt = 'Like';

    const likesCount = document.createElement('span');
    likesCount.textContent = `${likes}`;
    likesCount.classList.add('likes-count');

    likesButton.appendChild(heartIcon);
    likesButton.appendChild(likesCount);

    return likesButton;
}

function createCommentsElement(blogPost) {
    const commentsElement = document.createElement('ul');
    commentsElement.classList.add('comment-list');

    blogPost.comments.forEach((comment, index) => {
        const commentItem = document.createElement('li');
        const userIcon = document.createElement('img');
        userIcon.classList.add('heart-icon');
        userIcon.src = 'resources/user.png';
        userIcon.alt = 'user';

        const commentContent = document.createElement('span');
        commentContent.textContent = `${comment.userName} : ${comment.content}`;

        const commentLikesButton = createLikeButton(comment.likes);

        commentItem.appendChild(userIcon);
        commentItem.appendChild(commentContent);
        commentItem.appendChild(commentLikesButton);
        commentsElement.appendChild(commentItem);

        commentLikesButton.addEventListener('click', async () => {
            if (comment.liked || !loggedIn) {
                //Do nothing
                return;
            }
            try {
                const response = await fetch(`blogs/${blogPost._id}/comment/like/${index}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to like comment');
                }

                comment.likes++;
                commentLikesButton.querySelector('.likes-count').textContent = `${comment.likes}`;
                commentsElement.classList.add('liked');
                comment.liked = true;
            } catch (error) {
                console.error('Error: ', error.message);
            }
        });
    });
    return commentsElement;
}

function createCommentForm(blogPostId) {
    const commentForm = document.createElement('form');
    commentForm.classList.add('comment-form');
    const commentTextArea = document.createElement('textarea');
    commentTextArea.setAttribute('placeholder', 'Write your comment here...');
    commentTextArea.setAttribute('name', 'comment');
    commentTextArea.classList.add('form-control', 'mb-2');
    commentForm.appendChild(commentTextArea);

    const submitButton = document.createElement('button');
    submitButton.setAttribute('type', 'submit');
    submitButton.textContent = 'Submit';
    submitButton.classList.add('btn', 'btn-primary');
    commentForm.appendChild(submitButton);

    commentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!loggedIn) {
            console.log("Please login to submit a comment");
            return;
        }
        const formData = new FormData(commentForm);
        const commentContent = formData.get('comment');

        try {
            const response = await fetch(`/blogs/${blogPostId}/comment`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({content: commentContent, userID: userId})
            });

            if (!response.ok) {
                throw new Error("Failed to submit a comment");
            }

            commentForm.reset();
            console.log('Comment added successfully');
            const updatedBlogPosts = await fetch(`blogs/${blogPostId}`);
            const updatedBlogPost = await updatedBlogPosts.json();
            await fetchAndDisplayBlogPosts();
        } catch (error) {
            console.error('Error: ', error.message);
        }
    });

    return commentForm;
}
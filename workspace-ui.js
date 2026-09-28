import {
  addCustomCalculator,
  addForumPost,
  getCurrentUser,
  getForumPosts,
  getNewsletterInbox,
  login,
  logout,
  publishNewsletter,
  registerAccount,
  setNewsletterSubscription,
} from './app-store.js';
import { parse } from './main.js';

export function mountWorkspace() {
  const authForm = document.getElementById('auth-form');
  const username = document.getElementById('auth-username');
  const password = document.getElementById('auth-password');
  const authFeedback = document.getElementById('auth-feedback');
  const adminFeedback = document.getElementById('admin-feedback');
  const forumForm = document.getElementById('forum-form');
  const forumQuestion = document.getElementById('forum-question');
  const newsletterToggle = document.getElementById('newsletter-subscribe');

  function showFeedback(element, message) {
    element.textContent = message;
  }

  function renderList(container, items, emptyText, renderItem) {
    if (!items.length) {
      const empty = document.createElement('li');
      empty.className = 'community-empty';
      empty.textContent = emptyText;
      container.replaceChildren(empty);
      return;
    }
    container.replaceChildren(...items.map(renderItem));
  }

  function render() {
    const user = getCurrentUser();
    const signedIn = Boolean(user);
    authForm.hidden = signedIn;
    document.getElementById('account-session').hidden = !signedIn;
    document.getElementById('account-name').textContent = user?.username ?? '';
    document.getElementById('account-role').textContent =
      user?.role === 'admin' ? 'ADMIN' : 'MEMBER';
    document.getElementById('admin-tools').hidden = user?.role !== 'admin';
    forumForm.hidden = !signedIn;
    document.getElementById('forum-gate').hidden = signedIn;
    newsletterToggle.disabled = !signedIn;
    newsletterToggle.checked = Boolean(user?.subscribed);
    document.getElementById('newsletter-gate').hidden = Boolean(
      user?.subscribed,
    );

    renderList(
      document.getElementById('forum-list'),
      getForumPosts(),
      'No questions yet.',
      (post) => {
        const item = document.createElement('li');
        const heading = document.createElement('strong');
        heading.textContent = post.username;
        const time = document.createElement('time');
        time.dateTime = new Date(post.createdAt).toISOString();
        time.textContent = new Date(post.createdAt).toLocaleDateString();
        const message = document.createElement('p');
        message.textContent = post.message;
        item.append(heading, time, message);
        return item;
      },
    );

    let inbox = [];
    if (user?.subscribed) inbox = getNewsletterInbox();
    renderList(
      document.getElementById('newsletter-list'),
      inbox,
      user?.subscribed
        ? 'Your inbox is clear.'
        : 'Subscribe to receive new issues here.',
      (issue) => {
        const item = document.createElement('article');
        item.className = 'newsletter-issue';
        const heading = document.createElement('h3');
        heading.textContent = issue.title;
        const time = document.createElement('time');
        time.dateTime = new Date(issue.createdAt).toISOString();
        time.textContent = new Date(issue.createdAt).toLocaleDateString();
        const message = document.createElement('p');
        message.textContent = issue.body;
        item.append(heading, time, message);
        return item;
      },
    );
  }

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      login(username.value, password.value);
      password.value = '';
      showFeedback(authFeedback, 'Signed in.');
    } catch (error) {
      showFeedback(authFeedback, error.message);
    }
  });
  document.getElementById('auth-register').addEventListener('click', () => {
    if (!authForm.reportValidity()) return;
    try {
      registerAccount(username.value, password.value);
      password.value = '';
      showFeedback(authFeedback, 'Account created. You are signed in.');
    } catch (error) {
      showFeedback(authFeedback, error.message);
    }
  });
  document.getElementById('auth-logout').addEventListener('click', () => {
    logout();
    showFeedback(authFeedback, 'Signed out.');
  });
  forumForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      addForumPost(forumQuestion.value);
      forumQuestion.value = '';
    } catch (error) {
      showFeedback(authFeedback, error.message);
    }
  });
  newsletterToggle.addEventListener('change', () => {
    try {
      setNewsletterSubscription(newsletterToggle.checked);
    } catch (error) {
      showFeedback(authFeedback, error.message);
    }
  });
  document
    .getElementById('custom-calculator-form')
    .addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        const name = document.getElementById('custom-calculator-name').value;
        const expression = document.getElementById(
          'custom-calculator-expression',
        ).value;
        parse(expression, { x: 1 });
        addCustomCalculator(name, expression);
        event.currentTarget.reset();
        showFeedback(adminFeedback, 'Calculator added to Numerical.');
      } catch (error) {
        showFeedback(adminFeedback, error.message);
      }
    });
  document
    .getElementById('newsletter-form')
    .addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        publishNewsletter(
          document.getElementById('newsletter-title').value,
          document.getElementById('newsletter-body').value,
        );
        event.currentTarget.reset();
        showFeedback(
          adminFeedback,
          'Newsletter published to subscriber inboxes.',
        );
      } catch (error) {
        showFeedback(adminFeedback, error.message);
      }
    });
  window.addEventListener('numberlab:changed', render);
  render();
}

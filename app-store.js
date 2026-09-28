const storageKey = 'number-lab.workspace.v1';
const starterAdmin = {
  username: 'admin',
  password: 'numberlab',
  role: 'admin',
  subscribed: true,
};

function readState() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
  } catch {
    stored = null;
  }
  const state = stored && typeof stored === 'object' ? stored : {};
  state.users ??= [starterAdmin];
  if (!state.users.some((user) => user.username === starterAdmin.username)) {
    state.users.push(starterAdmin);
  }
  state.currentUser ??= null;
  state.regressionModels ??= [];
  state.customCalculators ??= [];
  state.forumPosts ??= [];
  state.newsletter ??= [];
  return state;
}

function writeState(state, changed = 'workspace') {
  localStorage.setItem(storageKey, JSON.stringify(state));
  window.dispatchEvent(
    new CustomEvent('numberlab:changed', { detail: changed }),
  );
}

function requireUser(state) {
  const user = state.users.find(
    (entry) => entry.username === state.currentUser?.username,
  );
  if (!user) throw new Error('Sign in to use this feature.');
  return user;
}

function publicUser(user) {
  return user
    ? { username: user.username, role: user.role, subscribed: user.subscribed }
    : null;
}

export function getCurrentUser() {
  const state = readState();
  return publicUser(
    state.users.find((user) => user.username === state.currentUser?.username),
  );
}

export function registerAccount(username, password) {
  const state = readState();
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(normalized)) {
    throw new Error('Use 3–24 letters, numbers, or underscores for your name.');
  }
  if (password.length < 6)
    throw new Error('Use a password with 6+ characters.');
  if (state.users.some((user) => user.username === normalized)) {
    throw new Error('That username is already taken.');
  }
  const user = {
    username: normalized,
    password,
    role: 'member',
    subscribed: false,
  };
  state.users.push(user);
  state.currentUser = { username: user.username };
  writeState(state, 'account');
  return publicUser(user);
}

export function login(username, password) {
  const state = readState();
  const normalized = username.trim().toLowerCase();
  const user = state.users.find(
    (entry) => entry.username === normalized && entry.password === password,
  );
  if (!user) throw new Error('Username or password is incorrect.');
  state.currentUser = { username: user.username };
  writeState(state, 'account');
  return publicUser(user);
}

export function logout() {
  const state = readState();
  state.currentUser = null;
  writeState(state, 'account');
}

export function getRegressionModels() {
  return readState().regressionModels;
}

export function saveRegressionModel(model) {
  const state = readState();
  state.regressionModels = state.regressionModels.filter(
    (entry) => entry.id !== model.id,
  );
  state.regressionModels.push({ ...model, savedAt: Date.now() });
  writeState(state, 'calculators');
}

export function getCustomCalculators() {
  return readState().customCalculators;
}

export function addCustomCalculator(name, expression) {
  const state = readState();
  const user = requireUser(state);
  if (user.role !== 'admin')
    throw new Error('Only the admin can add calculators.');
  const calculator = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    expression: expression.trim(),
    createdBy: user.username,
    createdAt: Date.now(),
  };
  state.customCalculators.push(calculator);
  writeState(state, 'calculators');
  return calculator;
}

export function addForumPost(message) {
  const state = readState();
  const user = requireUser(state);
  const post = {
    id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: user.username,
    message: message.trim(),
    createdAt: Date.now(),
  };
  state.forumPosts.unshift(post);
  writeState(state, 'forum');
  return post;
}

export function getForumPosts() {
  return readState().forumPosts;
}

export function setNewsletterSubscription(subscribed) {
  const state = readState();
  const user = requireUser(state);
  user.subscribed = Boolean(subscribed);
  writeState(state, 'newsletter');
}

export function publishNewsletter(title, body) {
  const state = readState();
  const user = requireUser(state);
  if (user.role !== 'admin')
    throw new Error('Only the admin can publish updates.');
  state.newsletter.unshift({
    id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    body: body.trim(),
    createdAt: Date.now(),
  });
  writeState(state, 'newsletter');
}

export function getNewsletterInbox() {
  const state = readState();
  const user = requireUser(state);
  return user.subscribed ? state.newsletter : [];
}

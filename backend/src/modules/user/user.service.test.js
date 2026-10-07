const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");

const servicePath = path.join(__dirname, "user.service.js");
const controllerPath = path.join(__dirname, "user.controller.js");
const originalLoad = Module._load;
const repository = {};

Module._load = function (request, parent, isMain) {
  if (parent?.filename === servicePath && request === "./user.repository") {
    return repository;
  }
  return originalLoad.call(this, request, parent, isMain);
};

delete require.cache[servicePath];
const service = require(servicePath);

test.beforeEach(() => {
  Object.assign(repository, {
    emailInUse: async () => false,
    findByIdAndUpdate: async (id, data) => ({ _id: id, ...data }),
  });
});

test.after(() => {
  Module._load = originalLoad;
});

test("normalizes profile fields and persists the selected language", async () => {
  let checkedEmail;
  let updated;
  repository.emailInUse = async (email) => {
    checkedEmail = email;
    return false;
  };
  repository.findByIdAndUpdate = async (id, data) => {
    updated = { id, data };
    return updated;
  };

  const result = await service.updateProfile(
    {
      id: "authenticated-user",
      name: "  Admin Name  ",
      email: " ADMIN@EXAMPLE.COM ",
      language: "ta",
    },
    { path: "profile/avatar.png" },
  );

  assert.equal(checkedEmail, "admin@example.com");
  assert.deepEqual(updated, {
    id: "authenticated-user",
    data: {
      name: "Admin Name",
      email: "admin@example.com",
      language: "ta",
      image: "profile/avatar.png",
    },
  });
  assert.equal(result, updated);
});

test("rejects invalid fields without updating the user", async (t) => {
  const invalidProfiles = [
    ["missing user id", { name: "Admin", email: "admin@example.com" }, 400],
    ["blank name", { id: "user-1", name: "  ", email: "admin@example.com" }, 400],
    ["oversized name", { id: "user-1", name: "a".repeat(101), email: "admin@example.com" }, 400],
    ["invalid email", { id: "user-1", name: "Admin", email: "not-an-email" }, 400],
    ["unsupported language", { id: "user-1", name: "Admin", email: "admin@example.com", language: "fr" }, 400],
  ];

  repository.findByIdAndUpdate = async () => {
    assert.fail("Invalid profile data must not be persisted.");
  };

  for (const [label, profile, status] of invalidProfiles) {
    await t.test(label, async () => {
      const result = await service.updateProfile(profile);
      assert.equal(result.status, status);
      assert.equal(typeof result.error, "string");
    });
  }
});

test("rejects email addresses already owned by another user", async () => {
  repository.emailInUse = async () => true;
  repository.findByIdAndUpdate = async () => {
    assert.fail("A duplicate email must not be persisted.");
  };

  const result = await service.updateProfile({
    id: "user-1",
    name: "Admin",
    email: "taken@example.com",
  });

  assert.equal(result.status, 409);
  assert.match(result.error, /already in use/);
});

test("leaves the saved language unchanged when none is submitted", async () => {
  let updateData;
  repository.findByIdAndUpdate = async (_id, data) => {
    updateData = data;
    return data;
  };

  await service.updateProfile({
    id: "user-1",
    name: "Admin",
    email: "admin@example.com",
  });

  assert.equal(Object.hasOwn(updateData, "language"), false);
});

test("uses the authenticated identity instead of the submitted user id", async () => {
  let capturedProfile;
  const mockedService = {
    updateProfile: async (profile) => {
      capturedProfile = profile;
      return {
        _id: profile.id,
        name: profile.name,
        email: profile.email,
        role: "admin",
        language: profile.language,
      };
    },
  };
  Module._load = function (request, parent, isMain) {
    if (parent?.filename === controllerPath && request === "./user.service") {
      return mockedService;
    }
    if (parent?.filename === servicePath && request === "./user.repository") {
      return repository;
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  delete require.cache[controllerPath];
  const controller = require(controllerPath);
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await controller.updateProfile(
    {
      auth: { id: "authenticated-user" },
      body: {
        id: "attacker-selected-user",
        name: "Admin",
        email: "admin@example.com",
      },
    },
    response,
  );

  assert.equal(capturedProfile.id, "authenticated-user");
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.user.id, "authenticated-user");
});

import { get, post, patch, del } from "./client.js";

export const projects = {
  list: (params = {}) => get("/projects", params),
  get: (id) => get(`/projects/${id}`),
  create: (body) => post("/projects", body),
  update: (id, body) => patch(`/projects/${id}`, body),
  remove: (id) => del(`/projects/${id}`),
};

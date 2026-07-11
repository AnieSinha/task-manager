import { get, post, del } from "./client.js";

export const roles = {
  list: (params = {}) => get("/roles", params),
  assignToUser: (userId, roleId) =>
    post(`/users/${userId}/roles`, { role_id: roleId }),
  removeFromUser: (userId, roleId) =>
    del(`/users/${userId}/roles/${roleId}`),
};

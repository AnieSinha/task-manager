import { post } from "./client.js";

export const ai = {
  summarizeProject: (projectId) => post(`/ai/projects/${projectId}/summary`, {}),
  generateRoadmap: (projectId, prompt) =>
    post(`/ai/projects/${projectId}/roadmap`, { prompt }),
  commitRoadmap: (projectId, tree) =>
    post(`/ai/projects/${projectId}/roadmap/commit`, { tree }),
};

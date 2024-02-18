const projectDirs = {
  divina: {
    dirs: ["/Volumes/SSD/Github/frontend-virtual-ER", "/Volumes/SSD/Github/react-frontend"],
    tasks: [
      { cmd: "yarn dev", cwd: 'emergency-room', dir: '/Volumes/SSD/Github/frontend-virtual-ER' },
    ],

  },
  payabl: {
    dirs: ["/Volumes/SSD/Github/payabl"],
    tasks: [
      { cmd: "dev" }
    ]
  },
  dc: {
    dirs: ["/Users/andrewshand/Documents/Github/design-cloud-github"],
    tasks: [
      { cmd: "bbuild dev" }
    ]
  },
  'student-portal': {
    dirs: ['/Users/andrewshand/Documents/Github/student-portal'],
    tasks: [
      { cmd: "nx run student-portal:start" }
    ]
  },
  chatbot: {
    dirs: [
      "/Volumes/SSD/Github/mtyknew/apps/my-app",
      "/Volumes/SSD/Github/mtyknew/modules/entities",
      "/Volumes/SSD/Github/mtyknew/modules/entities-client",
      "/Volumes/SSD/Github/mtyknew/modules/ai-chat"
    ],
    tasks: [
      { cmd: "dev" }
    ]
  },
};

export function getProjectDirs(projectId: string) {
  return projectDirs[projectId]?.dirs ?? [];
}

export function getProjectTasks(projectId: string) {
  return projectDirs[projectId]?.tasks ?? [];
}

export default projectDirs;

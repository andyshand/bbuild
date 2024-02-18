const projectDirs = {
  divina: ["/Volumes/SSD/Github/frontend-virtual-ER", "/Volumes/SSD/Github/react-frontend"],
  payabl: ["/Volumes/SSD/Github/payabl"],
  dc: ["/Users/andrewshand/Documents/Github/design-cloud-github", "/Users/andrewshand/Documents/Github/design-cloud-github/modules/design-cloud"],
  'student-portal': ['/Users/andrewshand/Documents/Github/student-portal'],
  chatbot: [
    "/Volumes/SSD/Github/mtyknew/apps/my-app",
    "/Volumes/SSD/Github/mtyknew/modules/entities",
    "/Volumes/SSD/Github/mtyknew/modules/entities-client",
    "/Volumes/SSD/Github/mtyknew/modules/ai-chat",
  ],
}

export function getProjectDirs(projectId: string) {
  return projectDirs[projectId]
}

export default projectDirs
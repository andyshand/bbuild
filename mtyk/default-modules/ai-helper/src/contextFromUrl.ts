export const contextFromUrl = (url: string) => {
  if (/npmjs.com/.test(url)) {
    const [_, packageName] = url.split('npmjs.com/package/');

    return {
      name: packageName,
      type: 'npm-package',
      url
    };
  }
  else if (/github.com/.test(url)) {
    const [_, packageName] = url.split('github.com/');

    return {
      name: packageName,
      type: 'github-repo',
      url
    };
  } else {
    return {
      name: url,
      type: 'url',
      url
    }
  }
};

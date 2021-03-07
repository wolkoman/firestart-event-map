import {decode} from 'base-64';

export const data = async () => {

  const org = 'firestartorg';

  const data = (await Promise.all(['produce', 'consume',].flatMap(async type => {
    const {items} = await fetchGitSearch(`${{produce: 'ProduceTopic', consume: 'ConsumeTopics'}[type]} user:${org}`);
    let mapped = items.map(result => ({repo: result.repository.name, path: result.path, type}));
    return mapped;
  }))).flat();

  const events = (await Promise.all(data.map(async d => {
    let response = await fetchGitContent(org, d.repo, d.path);
    if (response.message) return null;
    let eventName = d.type === 'produce'
      ? decode(response.content).match(/ProduceTopic => "(.*?)"/)
      : decode(response.content).match(/ConsumeTopics => new\[] {"(.*?)"}/);
    return {eventName, type: d.type, repo: d.repo};
  }))).filter(event => !!event).filter(event => !!event.eventName).map(event => ({...event, eventName: event.eventName[1]}));

  return events;
}

const fetchGit = (path) => {
  return fetch(`https://api.github.com/${path}`, {
    headers: {Authorization: `token ${process.env.GITHUB_TOKEN}`}
  }).then(x => x.json()).catch(x => console.log("fail",x));
}
const fetchGitSearch = (query) => {
  return fetchGit(`search/code?q=${encodeURI(query)}`);
}
const fetchGitContent = (owner, repo, path) => {
  return fetchGit(`repos/${owner}/${repo}/contents/${path}`);
}

import {decode} from 'base-64';

export default async (req, res) => {

  const org = "firestartorg";
  const { items: kafkaMappingResults } = await fetchGitSearch(`user:${org} filename:KafkaMappingProfile.cs`);
  const kafkaMappingData = kafkaMappingResults.map(x => ({path: x.path, repo: x.repository.name})).slice(0,1);
  const kafkaMappingContent = await Promise.all(
    kafkaMappingData.map(x =>
      fetchGitContent(org, x.repo, x.path)
        .then(a => ({
          events: decode(a.content)
            .match(/CreateMap<([^,]*),([^,]*)>/g)
            .map(line => line.match(/Kafka\w*/g))
            .flat()
            .filter(x => x !== "KafkaDto")
            .slice(0,1)
          ,
          repo: x.repo
        }))
    ));
  res.status(200).json(kafkaMappingContent)
}

const fetchGit = (path) => {
  return fetch(`https://api.github.com/${path}`, {
    headers: { Authorization: `token fb36bd53e1cc7b8eb633b05f6f9aede1cd828501`}
  }).then(x => x.json());
}
const fetchGitSearch = (query) => {
  return fetchGit(`search/code?q=${encodeURI(query)}`);
}
const fetchGitContent = (owner, repo, path) => {
  return fetchGit(`repos/${owner}/${repo}/contents/${path}`);
}

const kebapToPascalCase = str => str.split("-").map(str => `${str[0].toUpperCase()}${str.slice(1)}`).join("");
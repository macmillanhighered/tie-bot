const acceptedStacks = [
  'dev-achieve',
  'dev-achieve-uat',
  'int-achieve',
  'int-achieve-preprod',
  'iam',
  'plat',
  'courseware',
  'writing',
  'writing-api',
];

export const filterStackArray = (array, command) => {
  if (!acceptedStacks.includes(command)) return array;
  const filtered = array.filter((url) => {
    if (url.includes('dev-achieve') && command === 'dev-achieve') return url.includes(command) && !url.includes('uat');
    if (url.includes('int-achieve') && command === 'int-achieve') return url.includes(command) && !url.includes('preprod');
    return url.includes(command);
  });
  console.log(command, filtered.length);
  return filtered;
};

export const stackUrlHash = {
  'prod-green-iam': 'https://prod-green-iam.prod-mml.cloud/status',
  'prod-green-courseware': 'https://prod-green-courseware.prod-mml.cloud/status',
  'prod-green-plat': 'https://prod-green-plat.prod-mml.cloud/status',
  'prod-green-reading': 'https://prod-green-reading.prod-mml.cloud/status',
  'services-live.macmillantech': 'https://services-live.macmillantech.com/status',
  'prod-writing': 'https://writing.macmillanlearning.com/status',
  'prod-writing-api': 'https://writing-api.macmillanlearning.com/status',
  'int-achieve-preprod-iam': 'https://int-achieve-preprod-iam.mldev.cloud/status',
  'int-achieve-preprod-plat': 'https://int-achieve-preprod-plat.mldev.cloud/status',
  'int-achieve-preprod-courseware': 'https://int-achieve-preprod-courseware.mldev.cloud/status',
  'int-achieve-preprod-writing': 'https://int-achieve-preprod-writing.mldev.cloud/status',
  'int-achieve-preprod-writing-api': 'https://int-achieve-preprod-writing-api.mldev.cloud/status',
  'int-achieve-iam': 'https://int-achieve-iam.mldev.cloud/status',
  'int-achieve-plat': 'https://int-achieve-plat.mldev.cloud/status',
  'int-achieve-courseware': 'https://int-achieve-courseware.mldev.cloud/status',
  'int-achieve-writing-api': 'https://int-achieve-writing-api.mldev.cloud/status',
  'int-achieve-writing': 'https://int-achieve-writing.mldev.cloud/status',
  'dev-achieve-uat-iam': 'https://dev-achieve-uat-iam.mldev.cloud/status',
  'dev-achieve-uat-plat': 'https://dev-achieve-uat-plat.mldev.cloud/status',
  'dev-achieve-uat-courseware': 'https://dev-achieve-uat-courseware.mldev.cloud/status',
  'dev-achieve-uat-writing': 'https://dev-achieve-uat-writing.mldev.cloud/status',
  'dev-achieve-uat-writing-api': 'https://dev-achieve-uat-writing-api.mldev.cloud/status',
  'dev-achieve-courseware': 'https://dev-achieve-courseware.mldev.cloud/status',
  'dev-achieve-iam': 'https://dev-achieve-iam.mldev.cloud/status',
  'dev-achieve-plat': 'https://dev-achieve-plat.mldev.cloud/status',
  'dev-achieve-writing': 'https://dev-achieve-writing.mldev.cloud/status',
  'dev-achieve-writing-api': 'https://dev-achieve-writing-api.mldev.cloud/status',
  'dev-tie-iam': 'https://dev-tie-iam.mldev.cloud/status',
  'dev-tie-plat': 'https://dev-tie-plat.mldev.cloud/status',
  'dev-tie-courseware': 'https://dev-tie-courseware.mldev.cloud/status',
};

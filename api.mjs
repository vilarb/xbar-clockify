export const clockIn = async () => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Api-Key", process.env.API_TOKEN);

  const raw = JSON.stringify({
    start: new Date().toISOString(),
    projectId: process.env.PROJECT_ID,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(`${process.env.BASE_URL}/v1/workspaces/${process.env.WORKSPACE_ID}/user/${process.env.MY_USER_ID}/time-entries`, requestOptions);
  const data = await response.json();
  return data;
};

export const clockOut = async () => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Api-Key", process.env.API_TOKEN);

  const raw = JSON.stringify({
    end: new Date().toISOString(),
  });
  const requestOptions = {
    method: "PATCH",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(`${process.env.BASE_URL}/v1/workspaces/${process.env.WORKSPACE_ID}/user/${process.env.MY_USER_ID}/time-entries`, requestOptions);
  const data = await response.json();
  return data;
};

export const getTimeEntries = async () => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Api-Key", process.env.API_TOKEN);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const response = await fetch(`${process.env.BASE_URL}/v1/workspaces/${process.env.WORKSPACE_ID}/user/${process.env.MY_USER_ID}/time-entries`, requestOptions);
  const data = await response.json();
  return data;
};

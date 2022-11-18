import fixturesData from "./fixtures_data.json";
import fixturesDetail from "./fixtures_detail.json";

export default async function APICall(url, method = "get", data = null) {
  const SECRET_KEY = process.env.REACT_APP_RAPID_API_SECRET_KEY;
  let apiBaseURL = process.env.REACT_APP_RAPID_API_BASEURL;
  let useQueryString = true;

  if (method.toLowerCase() === "get") {
    useQueryString = true;
  } else {
    useQueryString = false;
  }

  // 查询世界杯数据：league_id=4265
  // https://api-football-v1.p.rapidapi.com/v2/fixtures/league/4265/next/100?timezone=Asia%2FShanghai

  // 获取本地json数据
  if (url.indexOf("fixtures/date") > -1) {
    console.log("API response fixturesData: ", fixturesData);
    return fixturesData;
  }
  // 获取本地json数据
  else if (url.indexOf("fixtures/id") > -1) {
    console.log("API response fixturesDetail: ", fixturesDetail);
    return fixturesDetail;
  }

  return fetch(apiBaseURL + url, {
    method: method,
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": SECRET_KEY,
      "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      useQueryString: useQueryString,
    },
    redirect: "follow",
    referrer: "no-referrer",
    body: method.toLowerCase() === "get" ? null : JSON.stringify(data),
  })
    .then((response) => {
      console.log("API response: ");

      return response.json();
    })
    .catch((error) => {
      console.log("api call error", error);
      //Toastr('danger', 'please check your network');
    });
}

// upcoming games
// GET: fixtures/date/2020-02-06?timezone=Europe/London

// fixture
//GET: fixtures/id/157508
// - fetch team logo home/away team

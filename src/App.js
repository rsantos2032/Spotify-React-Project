import React from 'react';
import './App.css';

let textColor = 'green';
let style = {
  color: textColor,
  'text-align': 'center'
};
let backgroundC = 'black';
let globalM = true;
let globalF = false;
let direction = 1;
let sort = 1;

export const authEndpoint = 'https://accounts.spotify.com/authorize';
// Replace with your app's client ID, redirect URI and desired scopes
export const clientId = "52ff915517dd45fd8f0c0f7cbffae3d2";
export const redirectUri = "https://rsantos2032.gitlab.io/my-app/"; //"http://localhost:3000/" 
export const scopes = [
    "user-top-read",
    "user-read-currently-playing",
    "user-read-playback-state",
];

const hash = window.location.hash
  .substring(1)
  .split("&")
  .reduce(function(initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
window.location.hash = "";

function sortJsonArrayByProperty(objArray, prop, direction){
    console.log(objArray);
    console.log(prop);
    if (arguments.length<2) throw new Error("sortJsonArrayByProp requires 2 arguments");
    var direct = arguments.length>2 ? arguments[2] : 1; //Default to ascending

    if (objArray && objArray.constructor===Array){
        var propPath = (prop.constructor===Array) ? prop : prop.split(".");
        objArray.sort(function(a,b){
            for (var p in propPath){
                if (a[propPath[p]] && b[propPath[p]]){
                    a = a[propPath[p]];
                    b = b[propPath[p]];
                }
            }
            if (typeof a === "string" && typeof b === "string") {
              a = a.match(/^\d+$/) ? +a : a;
              b = b.match(/^\d+$/) ? +b : b;
            }
            return ( (a < b) ? -1*direct : ((a > b) ? 1*direct : 0) );
        });
    }
}


class Filter extends React.Component {
  state = {isOpen: false, selectedPlaylist: null};

  handleShowDialog = param => e => {
    let playlistToGet;
    for (var i in this.props.playlist) {
      if (this.props.playlist[i].name == param) {
        playlistToGet = this.props.playlist[i];
        break;
      }
    }

    this.setState({isOpen: !this.state.isOpen, selectedPlaylist: playlistToGet});
    console.log(this.state.selectedPlaylist);
    console.log(this.state.isOpen);

  };

  render() {
    let playlist = this.props.playlist;
    let by = sort == -1 ? 'name' : 'totalDuration';

    direction == -1 ? sortJsonArrayByProperty(playlist, by, -1) :
        sortJsonArrayByProperty(playlist, by);
    let list = [];
    playlist.forEach((item, i) => {
      list.push(item.name);
    });

    let runningSum = 0;
    for (var i in playlist) {
      if (playlist[i].totalDuration <= 60) {
        runningSum += 1;
      }
    }

    list = list.length != 20 ? list : [];
    list = ( (list.length != runningSum) && !globalF ) || ( !(list.length = runningSum) && globalF ) ? list : [];


    //console.log(this.props.playlist);
    return (
      <div style={{color: textColor}}>
        <img/>
        <input class="textBox" type='text' onKeyUp={event =>
          this.props.onTextChange(event.target.value)}/>
          <ul class="autoList">
            {list.map((item => <li class="autoListBullet" onClick={this.handleShowDialog(item)}>{
              this.state.isOpen ?
                <dialog
                  className="dialog"
                  open
                  onClick={this.handleShowDialog}>
                  <img
                    style={{width: '500px'}}
                    className="image"
                    src={this.state.selectedPlaylist.imageURL}
                    onClick={this.handleShowDialog}
                    alt="no image"
                  />
                  <h3 style={{...style}}>Total Duration: {this.state.selectedPlaylist.totalDuration} Minutes</h3>
                  <h4 style={{...style}}>Tracks: </h4>
                  <ul>
                    {this.state.selectedPlaylist.songs.map(song =>
                      <li style={{...style}}>{song.name}</li>
                    )}
                  </ul>
                </dialog> : item
            }</li>))}
          </ul>
      </div>
    );
  }
}


class Playlist extends React.Component {
  state = { isOpen: false };

  handleShowDialog = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  render() {
    let playlist = this.props.playlist;
    let totalDuration = 0;

    for (var i in playlist.songs) {
      totalDuration += (playlist.songs[i].duration);
    }
    totalDuration = Math.round(totalDuration/60);

    return (
      <div style={{...style,display: 'inline-block', width: '25%'}}>

        {this.state.isOpen ?
          <dialog
            className="dialog"
            open
            onClick={this.handleShowDialog}>
            <img
              style={{width: '500px'}}
              className="image"
              src={playlist.imageURL}
              onClick={this.handleShowDialog}
              alt="no image"
            />
            <h3 style={{...style}}>Total Duration: {totalDuration} Minutes</h3>
            <h4 style={{...style}}>Tracks: </h4>
            <ul>
              {playlist.songs.map(song =>
                <li style={{...style}}>{song.name}</li>
              )}
            </ul>
          </dialog> :

          <div>
          <img src={playlist.imageURL} style={{width:'160px'}}
               onClick={this.handleShowDialog}
               />
              <h3>{playlist.name}</h3>
          </div>
        }
      </div>
    );
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      serverData: {},
      filterString: '',
      direction: 1,
      directionNotice: "Descending",
      sort: -1,
      sortBy: 'Time',
      maximal: 900000,
      maxDesc: 'Filter Song With Durations Longer Than 60 Minutes'
    };
  }
  componentDidMount() {
      document.body.style.backgroundColor = 'black';
      //let accessToken = this.getHashParams().access_token;
      let accessToken = hash.access_token;
      if (!accessToken)
        return;
      fetch('https://api.spotify.com/v1/me', {
        headers: {'Authorization': 'Bearer ' + accessToken}
      }).then(response => response.json())
      .then(data => this.setState({
        user: {
            name: data.display_name
          }
        }))

      fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {'Authorization': 'Bearer ' + accessToken}
      }).then(response => response.json())
      .then(playlistData => {
        let playlists = playlistData.items
        let trackDataPromises = playlists.map(playlist => {
          let responsePromise = fetch(playlist.tracks.href, {
            headers: {'Authorization': 'Bearer ' + accessToken}
          })
          let trackDataPromise = responsePromise
            .then(response => response.json())
          return trackDataPromise
        })
        let allTracksDataPromises =
          Promise.all(trackDataPromises)
        let playlistsPromise = allTracksDataPromises.then(trackDatas => {
          trackDatas.forEach((trackData, i) => {
            playlists[i].trackDatas = trackData.items
              .map(item => item.track)
              .map(trackData => ({
                name: trackData ? trackData.name : "",
                duration: trackData ? trackData.duration_ms / 1000 : 0
              }))
          })
          return playlists
        })
        return playlistsPromise
      })
      .then(playlists => this.setState({
        playlists: playlists.map(item => {
          return {
            name: item.name,
            imageURL: item.images[0].url,
            songs: item.trackDatas
          }
      })
      }));




  }
  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  onClick = () => {
    if (this.state.direction == -1) {
      this.setState({direction:1, directionNotice: 'Descending'})
    } else {
      this.setState({direction:-1, directionNotice: 'Ascending'})
    }
    direction = this.state.direction;
    console.log(this.state);
  }

  onClickSort = () => {
    if (this.state.sort == -1) {
      this.setState({sort:1, sortBy: 'Alphabetically'})
    } else {
      this.setState({sort:-1, sortBy: 'Time'})
    }
    sort = this.state.sort;
    console.log(this.state.sort);
  }

  onClickFilter = () => {
    if (this.state.maximal === 60) {
      this.setState({maximal: 900000, maxDesc: 'Filter Out Playlists With Durations Longer Than 60 Minutes'})
    } else {
      this.setState({maximal: 60, maxDesc: 'Unfilter To Return All Songs'});
    }
    globalF = !globalF;
  }


  render() {
    let playlistToReRender =
      this.state.user &&
      this.state.playlists
        ? this.state.playlists.filter(playlist => {
          let matchesPlaylist = playlist.name.toLowerCase().includes(
            this.state.filterString.toLowerCase())
          return matchesPlaylist
        }) : []

      for (var i in playlistToReRender) {
          let totalDuration = 0;
          for (var j in playlistToReRender[i].songs) {
            totalDuration += (playlistToReRender[i].songs[j].duration);
          }
          totalDuration = Math.round(totalDuration/60);
          playlistToReRender[i].totalDuration = totalDuration;
        }

      let playlistToRender = playlistToReRender.filter(playlist => {
        let matchesPlaylist = playlist.totalDuration < this.state.maximal;
        return matchesPlaylist
      })
      //console.log(carl);



    return (
      <div className="App" style={{'background-color': backgroundC}}>
        {this.state.user ?
          <div>
            <h1 style={{...style, 'fontSize': '54px'}}>
              {this.state.user.name}'s Playlist</h1>
              <div>
              <button class="directionBtn" onClick={this.onClick}>{this.state.directionNotice}</button>
              <button class="sortBtn" style={{display:'inline-block'}} onClick={this.onClickSort}>{this.state.sortBy}</button>
              <Filter style={{display:'inline-block', width:'100%'}} playlist={playlistToRender}
              onTextChange={text => {
                this.setState({filterString: text})}}/>
                <div>
                <button class="filterBtn" onClick={this.onClickFilter}>{this.state.maxDesc}</button>
                </div>
                {playlistToRender.map(playlist =>
                <Playlist playlist={playlist}/>
              )}
              </div>


          </div> : <a class="loginBtn" href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
                "%20"
              )}&response_type=token&show_dialog=true`}>
          Sign In With Spotify</a>}
      </div>
    );
  }
}

export default App;

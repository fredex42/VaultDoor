import React from 'react';
import SearchBarFile from "./searchnbrowse/SearchBarFile.jsx";
import ndjsonStream from "can-ndjson-stream";
import ResultsPanel from './searchnbrowse/ResultsPanel.jsx';
import PopupPreview from "./PopupPreview.jsx";
import { withRouter } from 'react-router-dom';

class SearchComponent extends React.Component {
    static resultsLimit = 100;

    constructor(props){
        super(props);

        this.state = {
            filePathSearch: "",
            searching: false,
            vaultId: "",
            fileEntries: [],
            requestedPreview: null,
            currentReader: null,
            currentAbort: null
        };

        this.updateFilePath = this.updateFilePath.bind(this);
        this.updateVaultId = this.updateVaultId.bind(this);
        this.asyncDownload = this.asyncDownload.bind(this);

        this.previewRequested = this.previewRequested.bind(this);
        this.previewClosed = this.previewClosed.bind(this);

        this.projectClicked = this.projectClicked.bind(this);
    }

    updateFilePath(newSearchPath){
        this.setState({filePathSearch: newSearchPath}, ()=>this.newSearch());
    }

    updateVaultId(newId){
        this.setState({vaultId: newId}, ()=>this.newSearch());
    }

    setStatePromise(newState) {
        return new Promise((resolve,reject)=>{
            try {
                this.setState(newState, ()=>resolve())
            } catch(err) {
                reject(err);
            }
        })
    }

    async asyncDownload(url){
        const abortController = new AbortController();

        const response = await fetch(url, {signal: abortController.signal});
        const stream = await ndjsonStream(response.body);
        const reader = stream.getReader();

        await this.setStatePromise({currentReader: reader, currentAbort: abortController});

        function readNextChunk(reader) {
            reader.read().then(({done, value}) => {
                if(value) {
                    this.setState(oldState=>{
                            return {fileEntries: oldState.fileEntries.concat([value]), searching: !done}
                        }, ()=>{
                            if(this.state.fileEntries.length>=SearchComponent.resultsLimit){
                                console.log("Reached limit, stopping");
                                reader.cancel();
                            }
                    });
                } else {
                    console.warn("Got no data");
                }
                if(done) {
                    this.setState({searching: false});
                } else {
                    readNextChunk(reader);
                }
            })
        }
        readNextChunk = readNextChunk.bind(this);
        readNextChunk(reader);
    }

    abortReadInProgress(){
        const myRef = this;
        return new Promise((resolve, reject)=>{
            if(!myRef.state.currentReader) {
                resolve();
                return;
            }
            //if(myRef.state.currentAbort) myRef.state.currentAbort.abort();
            myRef.state.currentReader.cancel().then(_=> {
                function waitForSearch() {
                    if (myRef.state.searching) {
                        console.log("Waiting for search to cancel...");
                        window.setTimeout(waitForSearch, 500);
                    } else {
                        console.log("Search cancelled");
                        resolve();
                    }
                }
                waitForSearch();
            });
        })
    }

    newSearch(){
        const urlBase = "/api/vault/" + this.state.vaultId + "/list";

        const url = this.state.filePathSearch ? urlBase + "?forFile="+this.state.filePathSearch : urlBase;

        this.abortReadInProgress().then(_=>
            this.setState({searching: true, fileEntries:[]}, ()=>
                this.asyncDownload(url).catch(err=>{
                    console.error(err);
                    this.setState({searching: false});
                }))
        );
    }

    previewRequested(oid){
        console.log("preview requested: ", oid);
        this.setState({requestedPreview: oid});
    }

    previewClosed(){
        this.setState({requestedPreview: null});
    }

    projectClicked(projectId) {
        this.props.history.push("/byproject?project=" + projectId);
    }
    render() {
        return <div className="windowpanel">
            <SearchBarFile filePath={this.state.filePathSearch} filePathUpdated={this.updateFilePath} selectedVault={this.state.vaultId} vaultSelectionChanged={this.updateVaultId}/>
            <span style={{"float":"right","margin-right": "2em", "display":this.state.searching ? "inline-block" : "none"}}>Loaded {this.state.fileEntries.length}...</span>
            <ResultsPanel entries={this.state.fileEntries} previewRequestedCb={this.previewRequested} projectClicked={this.projectClicked}/>
            {
                this.state.requestedPreview ? <PopupPreview oid={this.state.requestedPreview} vaultId={this.state.vaultId} dialogClose={this.previewClosed}/> : ""
            }
        </div>
    }
}

export default withRouter(SearchComponent);
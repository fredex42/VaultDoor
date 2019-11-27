import React from 'react';
import SearchBarFile from "./searchnbrowse/SearchBarFile.jsx";
import ndjsonStream from "can-ndjson-stream";
import ResultsPanel from './searchnbrowse/ResultsPanel.jsx';
import PopupPreview from "./PopupPreview.jsx";

class SearchComponent extends React.Component {
    static resultsLimit = 100;

    constructor(props){
        super(props);

        this.state = {
            filePathSearch: "",
            searching: false,
            vaultId: "",
            fileEntries: [],
            requestedPreview: null
        };

        this.updateFilePath = this.updateFilePath.bind(this);
        this.updateVaultId = this.updateVaultId.bind(this);
        this.asyncDownload = this.asyncDownload.bind(this);

        this.previewRequested = this.previewRequested.bind(this);
        this.previewClosed = this.previewClosed.bind(this);
    }

    updateFilePath(newSearchPath){
        this.setState({filePathSearch: newSearchPath}, ()=>this.newSearch());
    }

    updateVaultId(newId){
        this.setState({vaultId: newId}, ()=>this.newSearch());
    }

    async asyncDownload(url){
        const response = await fetch(url);
        const stream = await ndjsonStream(response.body);
        const reader = stream.getReader();

        function readNextChunk(reader) {
            reader.read().then(({done, value}) => {
                if(value) {
                    //console.log("Got value ", value);
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

    newSearch(){
        const url = "/api/vault/" + this.state.vaultId + "/list";

        this.setState({searching: true, fileEntries:[]}, ()=>this.asyncDownload(url));
    }

    previewRequested(oid){
        console.log("preview requested: ", oid);
        this.setState({requestedPreview: oid});
    }

    previewClosed(){
        this.setState({requestedPreview: null});
    }

    render() {
        return <div className="windowpanel">
            <SearchBarFile filePath={this.state.filePathSearch} filePathUpdated={this.updateFilePath} selectedVault={this.state.vaultId} vaultSelectionChanged={this.updateVaultId}/>
            <span style={{"float":"right","margin-right": "2em", "display":this.state.searching ? "inline-block" : "none"}}>Loaded {this.state.fileEntries.length}...</span>
            <ResultsPanel entries={this.state.fileEntries} previewRequestedCb={this.previewRequested}/>
            {
                this.state.requestedPreview ? <PopupPreview oid={this.state.requestedPreview} vaultId={this.state.vaultId} dialogClose={this.previewClosed}/> : ""
            }
        </div>
    }
}

export default SearchComponent;
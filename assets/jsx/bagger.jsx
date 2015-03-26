var React = require('react');

class Bagger extends React.Component {
    constructor(props) {
        super(props);
        this.state = {files: []};
    }
    handleClick(e) {
        e.preventDefault();
        this.setState({files: []});
    }
    handleChange(e) {
        e.preventDefault();
        this.setState({files: event.target.value});
        return;
    }
    render() {
        if (this.state.files.length !== 0) {
            return <div className="container"><p onClick={this.handleClick.bind(this)}>reset</p></div>;
        }
        return (
            <div className="container">
                <h1>Upload a bag</h1>
                <div id="dropzone" className="jumbotron text-center">
                    <p>Drag and drop files or directories here!</p>
                    <form className="form-horizontal" onChange={this.handleChange.bind(this)}>
                        <div className="form-group">
                            <label>Select files: <input type="file" multiple webkitdirectory /></label>
                            <button className="btn btn-primary">Go!</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

export { Bagger };

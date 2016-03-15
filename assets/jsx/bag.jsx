import React from 'react'
import filesize from 'filesize'


class Bag extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var total = [...this.props.sizes.values()].reduce((r, n) => r + n, 0);

        return (
            <div id="bag-contents" className="well well-sm">
                <h2>Content
                    <small>
                        &nbsp;{this.props.files.size.toLocaleString()} files
                        ({this.props.files.size > this.props.sizes.size
                            ? 'at least '
                        : ''} {filesize(total, {round: 0})})
                    </small>
                </h2>

            </div>
        );
    }

}

Bag.propTypes = {
    files: React.PropTypes.instanceOf(Map),
    hashes: React.PropTypes.instanceOf(Map),
    sizes: React.PropTypes.instanceOf(Map),
}

export default Bag;

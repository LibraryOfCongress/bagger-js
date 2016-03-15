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

                <table className="table table-striped">
                    <caption>
                        Current Contents
                    </caption>
                    <thead>
                        <tr>
                            <th className="file-name">Filename</th>
                            <th className="file-size">Size</th>
                            <th className="file-hash sha256">SHA-256</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...this.props.files.entries()].map(([path, file, sha256 = this.props.hashes.get(path)]) =>
                            <tr key={path}>
                                <td className="file-name">
                                    {path}
                                </td>
                                <td className="file-size">
                                    {this.props.sizes.get(path)}
                                </td>
                                <td className="file-hash sha256" title={sha256}>
                                    {sha256}
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total:</th>
                            <td className="file-size total">
                                {filesize(total)}
                            </td>
                            <td>
                            </td>
                            <td>
                            </td>
                        </tr>
                    </tfoot>
                </table>

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

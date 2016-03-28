import React from 'react'
import filesize from 'filesize'


class Bag extends React.Component {

    render() {
        const {files, hashes, sizes} = this.props.bagger

        var total = [...sizes.values()].reduce((r, n) => r + n, 0);

        return (
            <div id="bag-contents" className="well well-sm">
                <h2>Content
                    <small>
                        &nbsp;{files.size.toLocaleString()} files
                        ({files.size > sizes.size
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
                        {[...files.entries()].map(([path, , sha256 = hashes.get(path)]) =>
                            <tr key={path}>
                                <td className="file-name">
                                    {path}
                                </td>
                                <td className="file-size">
                                    {sizes.get(path)}
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
    sizes: React.PropTypes.instanceOf(Map)
}

export default Bag;

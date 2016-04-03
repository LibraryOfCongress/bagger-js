import React from 'react'

class Progress extends React.Component {

    render() {
        const {current, total} = this.props

        const complete = (100 * (current / total)).toFixed(0);
        const completed = (current === total)

        let classNames = ['progress-bar'];

        if (completed) {
            classNames.push('progress-bar-success');
        } else {
            classNames = classNames.concat(['progress-bar-striped', 'active']);
        }

        return (
            <div className="progress">
                <div
                    className={classNames.join(' ')}
                    role="progressbar"
                    aria-valuenow={{width: complete + '%'}}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style={{width: complete + '%'}}
                >
                    {complete}%
                </div>
            </div>
        )
    }
}

export default Progress;

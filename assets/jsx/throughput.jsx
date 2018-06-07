// @flow
import React from 'react';
import filesize from 'filesize';
import humanizeDuration from 'humanize-duration';

type State = {
    history: Array<any>,
    perSecond: number
};

class Throughput extends React.Component<any, any, State> {
    props: {
        current: number,
        total: number
    };

    state: State = {
        history: [],
        perSecond: 0
    };

    componentDidMount() {
        setInterval(() => {
            let perSecond = 0;
            const now = Date.now() / 1000.0;
            const current = this.props.current;
            if (this.state.history.length > 0) {
                const [t0, b0] = this.state.history;
                perSecond = (current - b0) / (now - t0);
            }

            this.setState({history: [now, current], perSecond});
        }, 1000);
    }

    render() {
        const {current, total} = this.props;
        const perSecond = this.state.perSecond;

        return (
            <div>
                average throughput:
                <code>{filesize(this.state.perSecond, {round: 1})}</code> per
                second. Time remaining:
                <code>
                    {humanizeDuration(((total - current) / perSecond) * 1000, {
                        round: true
                    })}
                </code>.
            </div>
        );
    }
}

export default Throughput;

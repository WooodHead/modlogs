import * as React from 'react';
import { connect } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router';
import LogItem, { LogItemProps } from './LogItem';
import { startLoadingBar, stopLoadingBar } from '../../store/actions';
import { StoreState } from '../../store/reducers';
import { ILog } from '../../../server/models/log/type';
import logApi from '../../api/log';
import './logpermalink.scss';

interface Props extends LogItemProps {
  startLoadingBar: typeof startLoadingBar;
  stopLoadingBar: typeof stopLoadingBar;
  fetchLog: typeof logApi;
  logs: ILog[];
  isAuthenticatedMod: boolean;
  onChangeLinkFilter: (filter: string) => void;
  onChangeAuthorFilter: (filter: string) => void;
}

interface Params {
  subreddit: string;
  permalinkId: string;
}

type PermalinkProps = Props & RouteComponentProps<Params, Params>;

interface State {
  log?: ILog;
  fetching: boolean;
}

class LogPermalink extends React.PureComponent<PermalinkProps, State> {
  constructor(props: PermalinkProps) {
    super(props);

    const state: State = {
      fetching: true,
    };

    if (props.logs) {
      const log = props.logs.find(l => l.redditId === props.params.permalinkId);
      if (log) {
        state.log = log;
        state.fetching = false;
      }
    }

    this.state = state;
  }

  public componentDidMount() {
    window.scrollTo(0, 0);

    if (!this.state.log) {
      const { startLoadingBar, stopLoadingBar, params, fetchLog } = this.props;
      startLoadingBar();
      fetchLog(params.subreddit, params.permalinkId).then(log => {
        this.setState({ log, fetching: false });
      }).catch(() => {
        this.setState({ fetching: false });
      }).then(() => {
        stopLoadingBar();
      });
    }
  }

  public render() {
    const { fetching, log } = this.state;
    const { isAuthenticatedMod, onChangeAuthorFilter, onChangeLinkFilter, params: { subreddit } } = this.props;

    if (fetching)
      return null;
    else if (log)
      return (
        <div className="log-permalink">
          <LogItem
            log={log}
            onChangeLinkFilter={onChangeLinkFilter}
            onChangeAuthorFilter={onChangeAuthorFilter}
            isAuthenticatedMod={isAuthenticatedMod}
          />

          <div className="view-all">
            <Link to={`/r/${subreddit}`}>
              view all logs for { subreddit }
            </Link>
          </div>
        </div>
      );
    else
      return <h4 className="text-center">Unable to find that log :(</h4>;
  }
}

export default connect((state: StoreState) => ({
  logs: state.logs.logs,
  fetchLog: state.app.api.log,
  isAuthenticatedMod: state.app.isAuthenticatedMod,
}), { startLoadingBar, stopLoadingBar })(LogPermalink);

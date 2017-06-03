import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import debounce = require('lodash.debounce');
import { StickyContainer, Sticky } from 'react-sticky';

import Filters from '../components/Logs/Filters';
import { ILogsState } from '../components/Logs/reducer';
import actions from '../components/Logs/actions';
import SubredditInfo from '../components/SubredditInfo';
import { LoadPropsArgs, LoadPropsCb } from '../types';
import shallowEqual from '../utils/shallowEqual';
import { ISubreddit } from '../../server/models/subreddit/type';
import '../components/Logs/logs.scss';
import './logs.scss';

interface Params {
  subreddit: string;
  permalinkId?: string;
}

interface Props extends ILogsState, RouteComponentProps<Params, any> {
  subreddits: ISubreddit[];
  limit: string;
  fetchLogs: typeof actions.fetchLogs;
  children: React.ReactElement<any>;
}

class LogsContainer extends React.PureComponent<Props, null> {
  public static loadProps({ params, loadContext: { dispatch, location } }: LoadPropsArgs<Params>, cb: LoadPropsCb) {
    dispatch(actions.fetchLogs(params.subreddit, location.query)).then(() => cb(null)).catch(cb);
  }

  constructor(props: Props) {
    super(props);
    this.debouncedFetchLogs = debounce(this.fetchLogs, 250);
  }

  private debouncedFetchLogs: (subreddit: string, query?: any) => any;
  private fetchLogs = (subreddit: string, query?: any) => {
    this.props.fetchLogs(subreddit, query);
  }

  public componentWillReceiveProps(nextProps: Props) {
    if (nextProps.location.query.actions !== this.props.location.query.actions) {
      return this.debouncedFetchLogs(nextProps.params.subreddit, nextProps.location.query);
    }

    if (
      nextProps.params.subreddit !== this.props.params.subreddit ||
      !shallowEqual(nextProps.location.query, this.props.location.query)
    ) {
      this.fetchLogs(nextProps.params.subreddit, nextProps.location.query);
    }
  }

  private updateRouteQuery = (updatedQuery: any) => {
    const { router, params: { subreddit }, location } = this.props;
    router.push({
      pathname: `/r/${subreddit}`,
      query: {
        ...location.query,
        ...updatedQuery,
      },
    });
  }

  public changeLimit = (nextLimit: string) => {
    const { location: { query } } = this.props;
    if (nextLimit === query.limit) return;
    this.updateRouteQuery({ limit: nextLimit });
  }

  public changeFilter = (nextFilter: string) => {
    const { location: { query } } = this.props;
    if (nextFilter === query.filter) return;
    this.updateRouteQuery({
      before: undefined,
      after: undefined,
      filter: nextFilter || undefined,
    });
  }

  public changeActions = (nextActions: string[]) => {
    this.updateRouteQuery({
      actions: nextActions.join(',') || undefined,
    });
  }

  public changeType = (type: string | null) => {
    this.updateRouteQuery({
      type: type || undefined,
    });
  }

  public clearFilters = () => {
    this.updateRouteQuery({
      filter: undefined,
      actions: undefined,
      type: undefined,
    });
  }

  private loadNewest = () => {
    this.updateRouteQuery({
      after: undefined,
      before: undefined,
    });
  }

  private loadNewer = () => {
    this.updateRouteQuery({
      after: undefined,
      before: this.props.before,
    });
  }

  private loadOlder = () => {
    this.updateRouteQuery({
      before: undefined,
      after: this.props.after,
    });
  }

  public render() {
    const {
      params,
      subreddits,
      children,
      location,
      location: {
        query: { limit = '25', filter = '', actions = '', type },
        query,
      },
      after,
      before,
    } = this.props;
    const viewingPermalink = !!params.permalinkId;

    return (
      <div className="logs">
        <div className="container-fluid">
          <StickyContainer className="row">
            <div className="col-md-8">
              <div className="log-item-container">
                { React.cloneElement(children, {
                  location,
                  onChangeFilter: this.changeFilter,
                })}
              </div>
            </div>

            <div className="col-md-4 sidebar">
              <Sticky>
                {({ style }: { style: any }) =>
                  <div className="sticky" style={style}>
                    <Filters
                      onChangeLimit={this.changeLimit}
                      onChangeFilter={this.changeFilter}
                      onChangeActions={this.changeActions}
                      onChangeType={this.changeType}
                      onClearFilters={this.clearFilters}
                      limit={limit}
                      currentFilter={filter}
                      currentActions={actions}
                      currentType={type}
                      disableFilters={viewingPermalink}
                    />

                    <div className="log-navigation">
                      <button
                        className="btn btn-default newest"
                        disabled={(!query.before && !query.after) || viewingPermalink}
                        onClick={this.loadNewest}
                      >
                        Newest
                      </button>

                      <button
                        className="btn btn-default newer"
                        disabled={!before || viewingPermalink}
                        onClick={this.loadNewer}
                      >
                        &lt; Newer
                      </button>

                      <button
                        className="btn btn-default older"
                        disabled={!after || viewingPermalink}
                        onClick={this.loadOlder}
                      >
                        Older &gt;
                      </button>
                    </div>

                    <SubredditInfo
                      selectedSubreddit={params.subreddit}
                      allSubreddits={subreddits}
                    />
                  </div>
                }
              </Sticky>
            </div>
          </StickyContainer>
        </div>
      </div>
    );
  }
}

export default connect(state => ({
  subreddits: state.app.subreddits,
  after: state.logs.after,
  before: state.logs.before,
}), actions)(LogsContainer);

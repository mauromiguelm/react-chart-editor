import PlotlyFold from './PlotlyFold';
import TraceRequiredPanel from './TraceRequiredPanel';
import PlotlyPanel from './PlotlyPanel';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {EDITOR_ACTIONS} from 'lib/constants';
import {connectTraceToPlot, plotlyTraceToCustomTrace} from 'lib';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import {traceTypes} from 'lib/traceTypes';

const TraceFold = connectTraceToPlot(PlotlyFold);

class TraceAccordion extends Component {
  constructor(props, context) {
    super(props, context);
    this.setLocals(props, context);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.setLocals(nextProps, nextContext);
  }

  setLocals(props, context) {
    const base = props.canGroup ? context.fullData : context.data;
    const traceFilterCondition = this.props.traceFilterCondition || (() => true);

    this.filteredTracesDataIndexes = [];
    this.filteredTraces = base.filter((t, i) => {
      const fullTrace = props.canGroup ? t : context.fullData.filter(tr => tr.index === i)[0];
      if (traceFilterCondition(t, fullTrace)) {
        this.filteredTracesDataIndexes.push(fullTrace.index);
        return true;
      }
      return false;
    });
  }

  renderGroupedTraceFolds() {
    if (!this.filteredTraces.length || this.filteredTraces.length <= 1) {
      return null;
    }

    const {localize: _} = this.context;
    const dataArrayPositionsByTraceType = {};
    const fullDataArrayPositionsByTraceType = {};

    this.filteredTraces.forEach(trace => {
      const traceType = plotlyTraceToCustomTrace(trace);
      if (!dataArrayPositionsByTraceType[traceType]) {
        dataArrayPositionsByTraceType[traceType] = [];
      }

      if (!fullDataArrayPositionsByTraceType[traceType]) {
        fullDataArrayPositionsByTraceType[traceType] = [];
      }

      dataArrayPositionsByTraceType[traceType].push(trace.index);
      // _expandedIndex is the trace's index in the fullData array
      fullDataArrayPositionsByTraceType[traceType].push(trace._expandedIndex);
    });

    return Object.keys(fullDataArrayPositionsByTraceType).map((type, index) => (
      <TraceFold
        key={index}
        traceIndexes={dataArrayPositionsByTraceType[type]}
        name={traceTypes(_).find(t => t.value === type).label}
        fullDataArrayPosition={fullDataArrayPositionsByTraceType[type]}
      >
        {this.props.children}
      </TraceFold>
    ));
  }

  renderUngroupedTraceFolds() {
    return this.filteredTraces.map((d, i) => (
      <TraceFold
        key={i}
        traceIndexes={[d.index]}
        canDelete={this.props.canAdd}
        fullDataArrayPosition={[d._expandedIndex]}
      >
        {this.props.children}
      </TraceFold>
    ));
  }

  renderTraceFolds() {
    return this.filteredTraces.map((d, i) => (
      <TraceFold
        key={i}
        traceIndexes={[this.filteredTracesDataIndexes[i]]}
        canDelete={this.props.canAdd}
      >
        {this.props.children}
      </TraceFold>
    ));
  }

  render() {
    const {canAdd, canGroup} = this.props;
    const _ = this.context.localize;

    if (canAdd) {
      const addAction = {
        label: _('Trace'),
        handler: ({onUpdate}) => {
          if (onUpdate) {
            onUpdate({
              type: EDITOR_ACTIONS.ADD_TRACE,
            });
          }
        },
      };
      const content = this.renderTraceFolds();
      return (
        <PlotlyPanel addAction={addAction}>
          {content.length ? (
            content
          ) : (
            <div className="panel__empty__message">
              <div className="panel__empty__message__heading">Trace your data.</div>
              <div className="panel__empty__message__content">
                <p>
                  {_(
                    'Traces of various types like bar and line are the building blocks of your figure.'
                  )}
                </p>
                <p>
                  {_(
                    'You can add as many as you like, mixing and matching types and arranging them into subplots.'
                  )}
                </p>
                <p>{_('Click on the + button above to add a trace.')}</p>
              </div>
            </div>
          )}
        </PlotlyPanel>
      );
    }

    if (canGroup) {
      if (this.filteredTraces.length === 1) {
        return <TraceRequiredPanel>{this.renderUngroupedTraceFolds()}</TraceRequiredPanel>;
      }

      if (this.filteredTraces.length > 1) {
        return (
          <TraceRequiredPanel noPadding>
            <Tabs>
              <TabList>
                <Tab>{_('Individually')}</Tab>
                <Tab>{_('By Type')}</Tab>
              </TabList>
              <TabPanel>
                <PlotlyPanel>{this.renderUngroupedTraceFolds()}</PlotlyPanel>
              </TabPanel>
              <TabPanel>
                <PlotlyPanel>{this.renderGroupedTraceFolds()}</PlotlyPanel>
              </TabPanel>
            </Tabs>
          </TraceRequiredPanel>
        );
      }
    }

    return <TraceRequiredPanel>{this.renderTraceFolds()}</TraceRequiredPanel>;
  }
}

TraceAccordion.contextTypes = {
  fullData: PropTypes.array,
  data: PropTypes.array,
  localize: PropTypes.func,
};

TraceAccordion.propTypes = {
  canAdd: PropTypes.bool,
  canGroup: PropTypes.bool,
  children: PropTypes.node,
  traceFilterCondition: PropTypes.func,
};

export default TraceAccordion;

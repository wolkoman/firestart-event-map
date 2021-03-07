import Head from 'next/head'
import React, {useEffect, useState} from 'react';
import vis from 'vis';
import {data} from '../util/data';

export default function Home({nodes, edges, unconsumed}) {
  const [info, setInfo] = useState({name: "", produces: [], consumes: []});
  useEffect(() => {
    var visData = {
      nodes: new vis.DataSet(nodes.map(n => ({id: n, label: n}))),
      edges: new vis.DataSet(edges.map(e => ({
        from: e.producer,
        to: e.consumer,
        label: e.eventName,
        font: {
          size: 8
        },
        length: 50,
        arrow: "to"
      }))),
    } as any;
    var network = new vis.Network(document.getElementById('network'), visData, {});
    network.on("selectNode", (data) => {
      const name = data.nodes[0];
      setInfo({name,
        produces: edges.filter(e => e.producer === name).map(e => e.eventName),
        consumes: edges.filter(e => e.consumer === name).map(e => e.eventName)
      });
    });
    return () => {
    };
  }, [nodes]);
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico"/>
      </Head>

      <main style={{display: "flex", height: "calc(100vh -  20px)"}}>
        {info ? <div style={{width: 300}}>
          <h1>{info.name}</h1>
          <p>
            <div style={{fontWeight: "bold"}}>Produces</div>
            {info.produces.map(x => <div>{x}</div>)}
          </p>
          <p>
            <div style={{fontWeight: "bold"}}>Consumes</div>
            {info.consumes.map(x => <div>{x}</div>)}
          </p>
        </div> : null}
        <div id="network" style={{width: '100%', height: "100%"}}/>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const info = await data();
  return {
    props: {
      nodes: info.map(i => i.repo)
        .filter((x, i, a) => a.indexOf(x) === i),
      edges: info
        .filter(x => x.type === 'produce')
        .map(x => ({
          eventName: x.eventName,
          producer: x.repo,
          consumer: info.find(i => i.type === 'consume' && i.eventName === x.eventName)?.repo ?? ''
        }))
        .filter(x => x.consumer !== ''),
      unconsumed: info.filter(x => x.type === 'produce' && !info.find(i => i.type === 'consume' && i.eventName === x.eventName)),
      unproduced: info.filter(x => x.type === 'consume' && !info.find(i => i.type === 'produce' && i.eventName === x.eventName)),
    }
  };
}

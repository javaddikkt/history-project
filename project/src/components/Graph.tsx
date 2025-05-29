import React, {useEffect, useRef, useState} from 'react';
import {DataSet, Network, type Node, type Edge} from 'vis-network/standalone';
import Modal from 'react-modal';
import data from '../data/images.json';
import 'vis-network/styles/vis-network.css';

Modal.setAppElement('#root');

type DataItem = typeof data[0];

const clusterColors: Record<string, { background: string; border: string}> = {
    'Сфера': {background: '#d88383', border: '#df6060'},
    'Личности': {background: '#ddb874', border: '#d19f33'},
    'Период': {background: '#a37c62', border: '#935a2c'},
    'Тема': {background: '#e6b27b', border: '#ec8d2f'},
};

export const Graph: React.FC = () => {
    const container = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<DataItem | null>(null);
    const [groupType, setGroupType] = useState<string>('');
    const [filterTag, setFilterTag] = useState<string>('');

    useEffect(() => {
        if (!container.current) return;

        const filteredData = filterTag
            ? data.filter(c => c.tags.includes(filterTag))
            : data;

        const nodes = new DataSet<Node>(
            filteredData.map(c => ({
                id: c.id,
                label: c.title,
                shape: 'image',
                image: c.img,
                size: 30,
                tags: c.tags,
            }))
        );

        const edges = new DataSet<Edge>();
        for (let i = 0; i < filteredData.length; i++) {
            for (let j = i + 1; j < filteredData.length; j++) {
                const a = filteredData[i], b = filteredData[j];
                if (a.tags.some(t => b.tags.includes(t))) {
                    edges.add({from: a.id, to: b.id} as Edge);
                }
            }
        }

        const network = new Network(
            container.current!,
            {nodes, edges},
            {
                physics: false,
                interaction: {
                    dragNodes: true, dragView: true, zoomView: true, hover: true
                },
                nodes: {
                    font: {
                        size: 14,
                        face: 'WDXL Lubrifont TC',
                        color: '#dcdcdc'
                    },
                    borderWidth: 2
                },
                edges: {color: {color: '#434343', hover: '#4a4a4a', highlight: '#787878'}, smooth: false}
            }
        );

        if (groupType && !filterTag) {
            let values: string[] = [];
            if (groupType === 'Сфера') values = ['Война', 'Быт', 'Культура'];
            else if (groupType === 'Личности') values = data.flatMap(c => c.tags[1]).filter(Boolean);
            else if (groupType === 'Период') values = data.flatMap(c => c.tags[2]).filter(Boolean);
            else if (groupType === 'Тема') values = data.flatMap(c => c.tags[3]).filter(Boolean);

            values.forEach(val => {
                network.cluster({
                    joinCondition: nodeOptions => nodeOptions.tags?.includes(val),
                    clusterNodeProperties: {
                        id: `cluster_${groupType}_${val}`,
                        label: val,
                        shape: 'box',
                        color: clusterColors[groupType],
                        font: {
                            color: '#000000'
                        },
                    } as Node
                });
            });
        }
        network.moveTo({
            position: { x: 600, y: 0 },
            scale: 0.5,
            animation: false
        });

        network.on('selectNode', params => {
            const nodeId = params.nodes[0]?.toString();
            if (!nodeId) return;

            if (nodeId.startsWith('cluster_')) {
                const parts = nodeId.split('_');
                const tagValue = parts.slice(2).join('_');
                setFilterTag(tagValue);
                setGroupType('');
            } else {
                const item = data.find(c => c.id === nodeId);
                if (item) setSelected(item);
            }
        });


        return () => network.destroy();
    }, [groupType, filterTag]);

    return (
        <>
            {!filterTag && (
                <div style={{marginTop: '10px', marginLeft: '20px', fontSize: 25}}>
                <label htmlFor="group-type" style={{marginRight: 8}}>
                    Группировать по:
                </label>
                <select
                    id="group-type"
                    value={groupType}
                    onChange={e => {
                        setGroupType(e.target.value);
                        setFilterTag('');
                    }}
                >
                    <option value="">Без группировки</option>
                    <option value="Сфера">Сфера</option>
                    <option value="Личности">Личности</option>
                    <option value="Период">Период</option>
                    <option value="Тема">Тема</option>
                </select>
            </div>
            )}

            {filterTag && (
                <div style={{marginTop: '0px', marginLeft: '25px', fontSize: 25}}>
                    <p><strong>Фильтр по тегу:</strong> {filterTag}</p>
                    <button
                        onClick={() => setFilterTag('')}
                        style={{marginLeft: '-5px', padding: '6px 12px', cursor: 'pointer', fontSize: 20}}
                    >
                        Показать все
                    </button>
                </div>
            )}

            <div ref={container} className="graph-container"/>

            <Modal
                isOpen={!!selected}
                onRequestClose={() => setSelected(null)}
                contentLabel="Информация о карикатуре"
                style={{
                    overlay: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: '#000000',
                    },
                    content: {
                        position: 'static',
                        inset: 'auto',
                        background: '#fff',
                        border: 'none',
                        padding: '10px',
                        overflow: 'auto',
                        maxHeight: '90vh',
                        maxWidth: '50vw',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'left',
                        borderRadius: '10px'
                    }
                }}
            >
                {selected && (
                    <>
                        <h1>{selected.title}</h1>
                        <img
                            src={selected.img}
                            alt={selected.title}
                            style={{
                                maxHeight: '50vh',
                                width: 'auto',
                                height: 'auto',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                borderRadius: 4,
                                marginBottom: 10
                            }}
                        />
                        <p style={{fontSize: 16, marginTop: 1}}>{selected.description}</p>
                        <div style={{marginTop: 8}}>
                            {selected.tags.map(tag => (tag != "") && (
                                <button
                                    onClick={() => {
                                        setFilterTag(tag);
                                        setSelected(null);
                                    }}
                                    key={tag}
                                    style={{
                                        display: 'inline-block',
                                        background: '#424242',
                                        color: '#fff',
                                        borderRadius: 4,
                                        padding: '4px 8px',
                                        marginRight: 3,
                                        fontSize: '0.9em',
                                        borderWidth: 2
                                    }}
                                >
                                  {tag}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setSelected(null)}
                            style={{
                                marginTop: 10,
                                padding: '8px 16px',
                                border: 'none',
                                background: '#6a6a6a',
                                color: '#fff',
                                borderRadius: 4,
                                cursor: 'pointer',
                                borderWidth: 2
                            }}
                        >
                            Закрыть
                        </button>
                    </>
                )}
            </Modal>
        </>
    );
};

import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import ForceGraph3D from "react-force-graph-3d";
import { Button, Drawer, theme, DatePicker, Space } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

function CypherViz() {
  const [startDate, setStartDate] = useState(
    dayjs().subtract(1, "year").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [displayWidth, setDisplayWidth] = useState(window.innerWidth);
  const [displayHeight, setDisplayHeight] = useState(window.innerHeight);

  window.addEventListener("resize", () => {
    console.log("resize Event");
    setDisplayWidth(window.innerWidth);
    setDisplayHeight(window.innerHeight);
  });

  console.log(process.env.REACT_APP_API_URI);
  const loadData = async () => {
    console.log(startDate, endDate);
    const query = `
    MATCH (s:Sewa)-[ob:ORGANIZED_BY]-(d:Department)
  MATCH (sr:Sewadar)-[pi:PARTICIPATES_IN]-(s)
  WHERE date(sr.dateOfEntry) > date('${startDate}') AND date(sr.dateOfEntry) < date('${endDate}')
  MATCH (s)-[ha:HELD_AT]-(c:Centre)
  RETURN s, sr, d, c, ob, pi, ha
    `;
    console.log(query);
    const options = {
      method: "POST",
      url: process.env.REACT_APP_API_URI + "/query",
      data: {
        query: query,
      },
    };
    const response = await axios.request(options);
    const result = response.data.result;
    // console.log(result);
    const t_nodes = [];
    const node_ids = [];
    const t_links = [];
    const link_ids = [];
    result.records.forEach((record) => {
      // Each 'p' will be a path with start and end node and a relationship

      const NODES = ["s", "sr", "c", "d"];
      const LINKS = ["ha", "pi", "ob"];

      NODES.forEach((el) => {
        const node = record["_fields"][record["_fieldLookup"][el]];
        const id = node.identity.low;
        if (!node_ids.includes(id)) {
          node_ids.push(id);
          t_nodes.push({ id, ...node.properties, name: node.labels[0] });
        }
      });
      LINKS.forEach((el) => {
        const node = record["_fields"][record["_fieldLookup"][el]];
        const id = node.identity.low;
        if (!link_ids.includes(id)) {
          link_ids.push(id);
          t_links.push({
            id,
            ...node.properties,
            name: node.type,
            source: node.start.low,
            target: node.end.low,
          });
        }
      });
    });
    setNodes(t_nodes);
    setLinks(t_links);
  };
  useEffect(() => {
    loadData();
  }, []);
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  const containerStyle = {
    position: "relative",
    overflow: "hidden",
    textAlign: "center",
    background: token.colorFillAlter,
  };
  return (
    <div style={containerStyle}>
      <ForceGraph3D
        // height={900}
        graphData={{ links, nodes }}
        // nodeId="name"
        // nodeLabel={(el) => el.properties.name}
        nodeAutoColorBy="name"
        linkAutoColorBy={"name"}
        linkWidth={1}
        linkCurvature={0.2}
        width={displayWidth}
        height={displayHeight}
        // linkDirectionalArrowRelPos={1}
        // linkDirectionalArrowLength={10}
      />
      <div
        style={{ top: 16, zIndex: 10000, position: "absolute", width: "100%" }}
      >
        <Button type="primary" onClick={showDrawer}>
          Settings
        </Button>
      </div>
      <Drawer
        title="Setting"
        placement="right"
        closable={false}
        onClose={onClose}
        open={open}
        getContainer={false}
      >
        <Space direction="vertical">
          <RangePicker
            allowClear={false}
            value={[dayjs(startDate), dayjs(endDate)]}
            format="YYYY-MM-DD"
            onChange={(e, d) => {
              setStartDate(d[0]);
              setEndDate(d[1]);
            }}
          />
          <Button onClick={loadData}>Ok</Button>
        </Space>
      </Drawer>
    </div>
  );
}

export default CypherViz;

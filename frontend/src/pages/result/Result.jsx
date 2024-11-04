/** @format */

import "./result.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Heading } from "../../components/Heading";
import ResultView from "./components/ResultView";

export default function Result() {
  const { state } = useLocation();

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const detectImages = state?.detectImages.split(',');
    if (!detectImages || !Array.isArray(detectImages)) return;

    const files = [];
    const folders = new Set();

    for (const detectImage of detectImages) {
      const paths = detectImage.split(/[\/\\]/);
      for (let i = 0; i < paths.length; i++) {
        if (i === 0) continue;
        folders.add(paths.slice(0, i).join('/'));
      }
      files.push({
        name: paths[paths.length - 1],
        parent: paths.length === 1 ? '' : paths.slice(0, paths.length - 1).join('/'),
        path: paths.join('/'),
      })
    }

    setFolders(Array.from(folders).map(folder => {
      const paths = folder.split('/');
      return {
        name: paths[paths.length - 1],
        parent: paths.length === 1 ? '' : paths.slice(0, paths.length - 1).join('/') + '/',
        path: folder,
      }
    }))
    setFiles(files);
  }, [])

  return (
    <div className="uploads-wrapper">
      <Heading className="uploads-h1" level={1}>
        Result
      </Heading>
      {files && files.length > 0 ? (
        <div className="uploads-list">
          <ResultView folders={folders} files={files} />
        </div>
      ) : (
        <div className="uploads-list uploads-list--empty">No result found</div>
      )}
    </div>
  );
}

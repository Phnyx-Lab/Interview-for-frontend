import React, { useState, useEffect } from "react";
import "./FileManager.css";
import ListIcon from "../../assets/Profile/List.tsx";
import GridIcon from "../../assets/Profile/Grid.tsx";
import { ReactComponent as PDFIcon } from "../../assets/Profile/PDFIcon.svg";
import { ReactComponent as ThreeDots } from "../../assets/Profile/ThreeDots.svg";
import { ReactComponent as ReloadIcon } from "../../assets/Profile/ReloadIcon.svg";
import API_BASE_URL from "../../config";
import axios from "axios";

interface FileUpload {
  name: string;
  documentGroup: string;
  uploadDate: Date;
  status: string;
}

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("latest");
  const [view, setView] = useState<"list" | "grid">("list");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const parseTimestamp = (timestamp: string) => {
    const year = parseInt(timestamp.slice(0, 4), 10);
    const month = parseInt(timestamp.slice(4, 6), 10) - 1; // JS months are 0-based
    const day = parseInt(timestamp.slice(6, 8), 10);
    const hour = parseInt(timestamp.slice(9, 11), 10);
    const minute = parseInt(timestamp.slice(11, 13), 10);
    const second = parseInt(timestamp.slice(13, 15), 10);

    return new Date(year, month, day, hour, minute, second);
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/list_recent_file_uploads`
      );
      const fetchedFiles = response.data.documents.map((doc: any) => ({
        name: doc.original_name,
        documentGroup: doc.document_group_name,
        uploadDate: parseTimestamp(doc.timestamp),
        status: doc.status,
      }));
      setFiles(fetchedFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleReload = () => {
    fetchFiles();
  };

  // Function to handle status filter change
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status === statusFilter ? null : status);
  };

  // Function to sort and filter files
  const sortedAndFilteredFiles = () => {
    return [...files]
      .filter(file => !statusFilter || file.status.toLowerCase() === statusFilter)
      .sort((a, b) => {
        switch (sortOrder) {
          case "latest":
            return b.uploadDate.getTime() - a.uploadDate.getTime();
          case "earliest":
            return a.uploadDate.getTime() - b.uploadDate.getTime();
          case "az":
            return a.name.localeCompare(b.name);
          case "za":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  };

  // Function to handle sort order change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
  };

  // Function to handle view change (list or grid)
  const handleViewChange = (viewType: "list" | "grid") => {
    setView(viewType);
  };

  return (
    <div className="file-manager-container">
      <div className="file-manager-header">
        <div className="section-title">
          최근 업로드
          <button className="reload-button status-button" onClick={handleReload}>
            <ReloadIcon />
          </button> 
        </div>

        <div className="header-buttons-container">
          <button 
            className={`status-button ${statusFilter === 'success' ? 'active success' : ''}`}
            onClick={() => handleStatusFilter('success')}
          >
            완료
          </button>
          <button 
            className={`status-button ${statusFilter === 'in_progress' ? 'active in-progress' : ''}`}
            onClick={() => handleStatusFilter('in_progress')}
          >
            업로드 중
          </button>
          <button 
            className={`status-button ${statusFilter === 'failure' ? 'active failure' : ''}`}
            onClick={() => handleStatusFilter('failure')}
          >
            실패
          </button>

          <select onChange={handleSortChange} value={sortOrder}>
            <option value="latest">정렬 기준</option>
            <option value="latest">최신 업로드</option>
            <option value="az">이름순 오름차순</option>
            <option value="za">이름순 내림차순</option>
          </select>


          <div className="view-buttons">
            <button onClick={() => handleViewChange("list")}>
              <ListIcon />
            </button>
            <button onClick={() => handleViewChange("grid")}>
              <GridIcon />
            </button>
          </div>
        </div>
      </div>

      <div className={`file-manager-content ${view}`}>
        {view === "list" && (
          <div className="file-manager-content-header">
            <div className="header-name">이름</div>
            <div className="header-group">문서 그룹</div>
            <div className="header-date">업로드 날짜</div>
            <div className="header-status">상태</div>
            <div className="header-place-holder" />
          </div>
        )}

        {sortedAndFilteredFiles().map((file, index) => (
          <div className={`file-item ${view}`} key={index}>
            {/* Left section with icon and name */}
            <div className="file-info">
              <div className="file-icon">
                <PDFIcon />
              </div>
              <p className="file-name">{file.name}</p>
            </div>

            {/* Middle section with document group */}
            {view === "list" && (
              <p className="document-group">{file.documentGroup}</p>
            )}

            {/* Right section with upload date */}
            {view === "list" && (
              <p className="upload-date">
                {file.uploadDate.toLocaleDateString()}
              </p>
            )}

            {/* Status section */}
            <p className={`file-status ${file.status.toLowerCase()}`}>
              {file.status}
            </p>

            {/* Three dots for more options */}
            <div className="more-options">
              <ThreeDots />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileManager;

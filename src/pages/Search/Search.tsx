import React from "react";
import "./Search.css";
import { ReactComponent as Logo } from "../../assets/Logo.svg";
import SideMenu from "../../components/SideMenu/SideMenu";
import SearchForm from "../../components/SearchForm/SearchForm";

const Search: React.FC = () => {

  const clear_screen = () => {
  }
  return (
    <div className="search-page">
      <a href="/" className="logo-link">
        <Logo className="logo" />
      </a>

      {/* Side Menu */}
      <div className="menu-container">
        <SideMenu />
      </div>

      {/* Header and Search Section */}
      <div className="header-container">
        <div className="title">PhnyX RAG에게 무엇이든 물어보세요.</div>
        <SearchForm clear_screen={clear_screen}/>
      </div>
    </div>
  );
};

export default Search;

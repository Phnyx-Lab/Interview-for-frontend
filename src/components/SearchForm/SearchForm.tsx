import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SubmitButton from "../SubmitButton/SubmitButton";
import "./SearchForm.css";
import API_BASE_URL from "../../config.ts"; // Import the API base URL
import Spinner from "../Spinner/Spinner";
import { fetchAuthSession } from "aws-amplify/auth";
import { EventSourcePolyfill } from 'event-source-polyfill';

interface SearchFormProps {
  clear_screen: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ clear_screen }) => {
  const [query, setQuery] = useState<string>("");
  // const [language, setLanguage] = useState<string>("KOREAN");
  // const [collectionType, setCollectionType] = useState<string>("LAYOUT_AWARE");
  // const [collectionTypes, setCollectionTypes] = useState<string[]>([]); // Store collection types from API
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [retrievedChunks, setRetrievedChunks] = useState<any[]>([]);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(
    null
  ); // Store generated response
  const [chatStrid, setChatStrid] = useState<string | null>(null); // Store the chat_strid

  const navigate = useNavigate();

  // // Fetch collection types from API on component mount
  // useEffect(() => {
  //   const fetchCollectionTypes = async () => {
  //     try {
  //       const response = await axios.get(`${API_BASE_URL}/list_collection_types`);
  //       setCollectionTypes(response.data.collection_types); // Populate the collection types
  //     } catch (error) {
  //       console.error("Error fetching collection types:", error);
  //       setError("Failed to fetch collection types.");
  //     }
  //   };

  //   fetchCollectionTypes();
  // }, []);

  useEffect(() => {
    if ((retrievedChunks.length > 0 || generatedResponse) && loading) {
      setLoading(false);
      // only navigate if there is either retrievedChunks or generatedResponse
      navigate("/result", {
        state: {
          locationRetrievedChunks: retrievedChunks.map((chunk) => chunk.valueOf()),
          locationGeneratedResponse: generatedResponse?.valueOf(),
          locationOriginalQuery: query.valueOf(),
          locationChatStrid: chatStrid?.valueOf(),
        },
      });
    }
  }, [retrievedChunks, generatedResponse, navigate, query]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query) {
      setError("Please enter a query.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Clear the screen
    setRetrievedChunks([]);
    setGeneratedResponse(null);
    clear_screen();


    try {
      const response = await axios.post(`${API_BASE_URL}/search`, {
        query: query,
        document_group_name: "test",
        collection_type: "LAYOUT_AWARE",
      });

      const chatStrid = response.data.chat_strid;
      if (!chatStrid) {
        throw new Error("Invalid chat_strid");
      }

      // Use setChatStrid here
      setChatStrid(chatStrid);
      console.log("Chat Strid:", chatStrid);
      const session = await fetchAuthSession();

      const idToken = session?.tokens?.idToken?.toString() || "";
      const eventSource = new EventSourcePolyfill(
        `${API_BASE_URL}/search?chat_strid=${chatStrid}`,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }
      );

      let dataReceived = 0;

      // Listen for streaming events
      eventSource.onmessage = (event) => {
        dataReceived += 1;
        const parsedData = JSON.parse(event.data);
        if (parsedData.status === "failure") {
          console.error(`Service failed: ${parsedData.fail_reason}`);
          setError(`Service failed: ${parsedData.fail_reason}`);
          eventSource.close(); // Stop listening since it failed
          setLoading(false);
          return;
        }

        if (dataReceived === 3) {
          setRetrievedChunks(parsedData.retrieved_chunks);
          console.log("Updated retrievedChunks:", parsedData.retrieved_chunks);
        }
        if (dataReceived === 4) {
          setGeneratedResponse(parsedData.generated_answer); // Corrected key name
        }

        // Once both retrievedChunks and generatedResponse are available, navigate to the result page
        if (dataReceived === 3) {
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error("Error with SSE connection:", error);
        setError("Failed to fetch results. Please try again.");
        eventSource.close();
        setLoading(false);
      };
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
      setLoading(false);
    } finally {
      // setLoading(false);
    }
  };

  // Navigate to the result page with the query result
  //   navigate("/result", { state: { result: generated_response.data } });
  // } catch (err) {
  //   setError("Failed to fetch results. Please try again.");
  // } finally {
  //   setLoading(false);
  // }

  return (
    <div className="form-container">
      <form onSubmit={onSubmit}>
        <div className="input-wrapper">
          {/* Dropdown for language selection */}
          {/* <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-dropdown"
          >
            <option value="KOREAN">Korean</option>
            <option value="ENGLISH">English</option>
          </select> */}

          {/* Dropdown for collection type selection */}
          {/* <select
            id="collection-select"
            value={collectionType}
            onChange={(e) => setCollectionType(e.target.value)}
            className="language-dropdown"
          >
            {collectionTypes.length > 0 ? (
              collectionTypes.map((collection, index) => (
                <option key={index} value={collection}>
                  {collection}
                </option>
              ))
            ) : (
              <option disabled>Loading collection types...</option>
            )}
          </select> */}

          {/* Input for query */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="질문을 입력하세요."
            className="search-input"
          />

          {/* Submit Button */}
          <div className="submit-button">
            <SubmitButton />
          </div>
        </div>
      </form>
      
      {loading && (
          <div className="spinner-container">
            <Spinner />
          </div>
        )}


      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default SearchForm;

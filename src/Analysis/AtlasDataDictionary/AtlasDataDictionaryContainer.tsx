import React, { useState } from 'react';
import { Table } from '@mantine/core';
import TableData from './TestData/TableData';
import ColumnHeaders from './Components/ColumnHeaders/ColumnHeaders';
import EntriesHeader from './Components/EntriesHeader/EntriesHeader';
import SearchBar from './Components/SearchBar/SearchBar';
import TableRow from './Components/TableRow/TableRow';
import PaginationControls from './Components/PaginationControls/PaginationControls';
import { ISortConfig } from './Interfaces/Interfaces';
import PreprocessTableData from './Utils/PreprocessTableData';
import InitialDataDictionaryTableState from './Utils/InitialDataDictionaryTableState';
import { DetermineNextSortDirection, SortDataWithDirection } from './Utils/SortUtils';
import './AtlasDataDictionary.css';

const AtlasDataDictionaryContainer = () => {
  const preprocessedTableData = PreprocessTableData(TableData);
  const [data, setData] = useState(preprocessedTableData);

  const [dataDictionaryTableState, setDataDictionaryTableState] = useState(
    InitialDataDictionaryTableState,
  );
  const {
    openDropdowns,
    searchTerm,
    sortConfig,
    currentPage,
    entriesShown,
    columnsShown,
  } = dataDictionaryTableState;

  const entriesHeaderStart = dataDictionaryTableState.entriesShown
      * dataDictionaryTableState.currentPage
    - dataDictionaryTableState.entriesShown
    + 1;

  const entriesHeaderStop = dataDictionaryTableState.entriesShown
    * dataDictionaryTableState.currentPage;

  const paginatedData = data.slice(
    entriesShown * currentPage - entriesShown,
    entriesShown * currentPage,
  );

  const handleTableChange = (
    event:
      | 'openDropdown'
      | 'closeDropdown'
      | 'currentPage'
      | 'entriesShown'
      | 'searchTerm'
      | 'sortConfig'
      | 'columnManagement',
    eventData: any,
  ) => {
    if (event === 'openDropdown') {
      setDataDictionaryTableState({
        ...dataDictionaryTableState,
        openDropdowns: [...openDropdowns, eventData],
      });
    } else if (event === 'closeDropdown') {
      setDataDictionaryTableState({
        ...dataDictionaryTableState,
        openDropdowns: openDropdowns.filter(
          (dropdownNumber: number) => dropdownNumber !== eventData,
        ),
      });
    } else if (event === 'currentPage') {
      setDataDictionaryTableState({
        ...dataDictionaryTableState,
        currentPage: eventData,
      });
    } else if (event === 'entriesShown' || event === 'searchTerm' || event === 'sortConfig') {
      setDataDictionaryTableState({
        ...dataDictionaryTableState,
        [event]: eventData,
        currentPage: 1,
      });
    } else {
      throw new Error(
        `handleTableChange called with invalid parameters: event: ${event}, eventData: ${eventData}`,
      );
    }
  };

  const handleSort = (sortKey: string) => {
    const newDirection: ISortConfig['direction'] = DetermineNextSortDirection(sortConfig as ISortConfig, sortKey);
    const sortedData = SortDataWithDirection(data, newDirection, sortKey);
    // if column is set to off reset to initial sort
    if (newDirection === 'off') {
      setData(preprocessedTableData);
    } else {
      // Otherwise set with sortedData
      setData(sortedData);
    }
    handleTableChange('sortConfig', { sortKey, direction: newDirection });
  };

  const rows = paginatedData.map((rowObject, i) => (
    <TableRow
      key={i}
      rowObject={rowObject}
      handleTableChange={handleTableChange}
      openDropdowns={openDropdowns}
      columnsShown={columnsShown}
      searchTerm={searchTerm}
    />
  ));

  return (
    <div
      className='atlas-data-dictionary-container'
      data-testid='atlas-data-dictionary-container'
    >
      <Table>
        <SearchBar
          columnsShown={columnsShown}
          TableData={preprocessedTableData}
          setData={setData}
          searchTerm={searchTerm}
          handleTableChange={handleTableChange}
        />
        <ColumnHeaders
          handleSort={handleSort}
          sortConfig={sortConfig as ISortConfig}
        />
        <tbody>
          {rows}
          {!data.length && (
            <tr className='no-data-found'>
              <td colSpan={columnsShown}>
                <h2>No Data Found</h2>
              </td>
            </tr>
          )}
        </tbody>
        <EntriesHeader
          start={entriesHeaderStart}
          stop={entriesHeaderStop}
          total={data.length}
          colspan={columnsShown}
        />
      </Table>
      <PaginationControls
        entriesShown={entriesShown}
        handleTableChange={handleTableChange}
        currentPage={currentPage}
        totalEntriesAvailable={data.length}
      />
    </div>
  );
};

export default AtlasDataDictionaryContainer;

import React, {useEffect, useMemo, useRef, useState} from "react";
import "./style2.css";
import iconImage1 from './icons/c-r.png';
import iconImage2 from './icons/c-g.png';
import iconImage3 from './icons/c-b.png';
import iconImage4 from './icons/c-y.png';
import iconImage5 from './icons/t-r.png';
import iconImage6 from './icons/t-g.png';
import iconImage7 from './icons/t-b.png';
// import iconImage8 from './icons/t-y.png';
// import iconImage9 from './icons/r-r.png';
// import iconImage10 from './icons/r-g.png';
// import iconImage11 from './icons/r-b.png';
// import iconImage12 from './icons/r-y.png';
import iconImage13 from './icons/search.png'
import ttImage from './imgs/tt.png';
import mmImage from './imgs/mm.png';
import getdatatools from "./getdatetools2"


/// 加一个projcet，time的过滤框

const GunttChart = (props) => {
        const {
            rowHeight = 60, ///数据行高
            width = "100%",
            bodyHeight = "calc(100% - 40px)",
            rowTitle = "Task List", //首列名称
        } = props;
        const valueScrollRef = useRef();
        const timeScrollRef = useRef();
        const [offsetX, setOffsetX] = useState('');
        const [offsetY, setOffsetY] = useState("");
        const [translateX, setTranslateX] = useState(0);
        const [tooltipVisble, setTooltipVisble] = useState("none");
        const [tooltipData, setTooltipData] = useState(null);
        const [data, setData] = useState(null);
        const [rows, setRows] = useState(props.rows);
        const [dataSource, setDataSource] = useState(props.dataSource);
        const [dataSource2, setDataSource2] = useState(props.dataSource2);
        const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode') || 'Days');
        const [weeks, setWeeks] = useState([]);
        const [months, setMonths] = useState([]);
        const [quarters, setQuarters] = useState([]);
        const [years, setYears] = useState([]);
        const [dayWidth, setDayWidth] = useState(80);
        const onScrollY = (e) => {
            // valueScrollRef.current.scrollTop = e.target.scrollTop;
        };

        const onScrollX = (e) => {
            timeScrollRef.current.scrollLeft = e.target.scrollLeft;
        };

        const onWheel = (e) => {
            timeScrollRef.current.scrollLeft += e.deltaY;
            valueScrollRef.current.scrollLeft += e.deltaY;
        };

        const onMouseEnter = (e, value) => {
            // console.log('mouseenter')
            setTooltipData(value);
            setTooltipVisble("block");
        };

        const onMouseMove = (e) => {
            e.nativeEvent.stopImmediatePropagation();
            const offset = ((e.clientX / document.body.clientWidth) * 100).toFixed(0);
            setTranslateX(offset);
            setOffsetX(e.clientX);
            setOffsetY(e.clientY);
        };

        const onMouseLeave = (e) => {
            setTooltipVisble("none");
        };

        // 向后端请求数据
        useEffect(() => {
            fetch('http://127.0.0.1:5000')
                .then(response => response.json())
                .then(data => setData(data))
                .catch(err => console.error(err));
        }, []);

        //对数据进行预处理
        useEffect(() => {
            if (data) {
                // console.log(data)
                // 创建一个按 cdb_project_id 分组的 tasks 对象
                const tasksByProject = data.data.tasks.reduce((acc, task) => {
                    if (!acc[task.cdb_project_id]) {
                        acc[task.cdb_project_id] = [];
                    }
                    acc[task.cdb_project_id].push(task);
                    return acc;
                }, {});
                // console.log(tasksByProject)
                // 创建一个按 cdb_project_id 分组的 issues 对象
                const issuesByProject = data.data.issues.reduce((acc, issue) => {
                    if (!acc[issue.cdb_project_id]) {
                        acc[issue.cdb_project_id] = [];
                    }
                    acc[issue.cdb_project_id].push(issue);
                    return acc;
                }, {});

                const effortTree = [];
                for (let projectId in tasksByProject) {
                    const projectNode = {
                        title: projectId,
                        key: projectId,
                        count_effort: 0,
                        children: [],
                    };

                    const tasksNode = {
                        title: "Tasks",
                        key: `${projectId}_tasks`,
                        count_effort: 0,
                        children: [],
                    };
                    tasksByProject[projectId].forEach((task, index) => {
                        // console.log(task)
                        const effortListNode = {
                            title: "Effort List",
                            key: `${projectId}_${task.task_id}_effortlist`,
                            count_effort: 0,
                            children: [],
                        };
                        task.effort_list.forEach((effort) => {
                            effortListNode.children.push({
                                title: `${effort.data_time}`,
                                key: `${projectId}_${task.task_id}_${effort.data_time}`,
                                count_effort: effort.effort_today,
                            });
                            effortListNode.count_effort += effort.effort_today;
                        });
                        task.effortlist = [effortListNode]; // 添加 effortlist 列表
                        tasksNode.children.push({
                            title: `${task.task_id} - ${task.task_name}`,
                            key: `${projectId}_${task.task_id}`,
                            start_time:`${task.start_time}`,
                            end_time:`${task.end_time}`,
                            count_effort: task.count_effort,
                            children: task.effortlist, // 将 effortlist 列表添加到子元素中
                        });
                        tasksNode.count_effort += task.count_effort;
                    });
                    projectNode.children.push(tasksNode);
                    projectNode.count_effort += tasksNode.count_effort;

                    // if (issuesByProject[projectId]) {
                    //     const issuesNode = {
                    //         title: "Issues",
                    //         key: `${projectId}_issues`,
                    //         count_effort: 0,
                    //         children: [],
                    //     };
                    //     issuesByProject[projectId].forEach((issue, index) => {
                    //         // console.log(issue)
                    //         // console.log(issue.effort_list)
                    //         issuesNode.children.push({
                    //             title: `${issue.issue_id} - ${issue.issue_name}`,
                    //             key: `${projectId}_${issue.issue_id}`,
                    //             end_time:`${issue.end_time}`,
                    //             count_effort: issue.count_effort,
                    //             children: issue.effort_list,
                    //         });
                    //         issuesNode.count_effort += issue.count_effort;
                    //     });
                    //     projectNode.children.push(issuesNode);
                    //     projectNode.count_effort += issuesNode.count_effort;
                    // }

                    effortTree.push(projectNode);
                }

                for (let projectId in issuesByProject) {
                    if (!tasksByProject[projectId]) {
                        const projectNode = {
                            title: projectId,
                            key: projectId,
                            count_effort: 0,
                            children: [],
                        };

                        const issuesNode = {
                            title: "Issues",
                            key: `${projectId}_issues`,
                            count_effort: 0,
                            children: [],
                        };
                        issuesByProject[projectId].forEach((issue, index) => {
                            issuesNode.children.push({
                                title: `${issue.issue_id} - ${issue.issue_name}`,
                                key: `${projectId}_${issue.issue_id}`,
                                count_effort: issue.count_effort,
                            });
                            issuesNode.count_effort += issue.count_effort;
                        });
                        projectNode.children.push(issuesNode);
                        projectNode.count_effort += issuesNode.count_effort;

                        effortTree.push(projectNode);
                    }
                }

                setRows(effortTree);
                // console.log(effortTree);


                setTimeout(() => {
                    const divs = document.querySelectorAll(".row_desc_container");
                    let maxWidth = 0;
                    divs.forEach(div => {
                        const width = div.offsetWidth;
                        if (width > maxWidth) {
                            maxWidth = width;
                        }
                    });
                    divs.forEach(div => {
                        div.style.width = `calc(${maxWidth}px)`;
                    });
                }, 100);
            }
        }, [data]);


        // 计算最早的一天
        const startDate = useMemo(() => {
            if (!data || (!data.data.tasks && !data.data.issues)) {
                return new Date(); // 返回当前日期或其他默认值，表示当dataSource为undefined或tasks和issues都为空时的处理
            }

            let earliestDate = new Date(data.data.tasks[0].effort_list[0].data_time);
            ["tasks", "issues"].forEach(type => {
                data.data[type].forEach(item => {
                    item.effort_list.forEach(effort => {
                        let effortDate = new Date(effort.data_time);
                        if (effortDate < earliestDate) {
                            earliestDate = effortDate;
                        }
                    });
                });
            });

            earliestDate.setDate(earliestDate.getDate());
            // console.log(earliestDate);
            return earliestDate;
        }, [rows]);

        const latestEndDate = useMemo(() => {
            if (!data || (!data.data.tasks && !data.data.issues)) {
                return new Date(); // 返回当前日期或其他默认值，表示当dataSource为undefined或tasks和issues都为空时的处理
            }

            let latestDate = new Date(startDate);
            ["tasks", "issues"].forEach(type => {
                data.data[type].forEach(item => {
                    let enddate = new Date(item.end_time)
                    if (enddate>latestDate){
                        latestDate = enddate;
                    }

                    });
                });

            // console.log(latestDate);
            return latestDate;
        }, [rows, startDate]);

        const datesArray = useMemo(() => {
            // console.log(startDate,latestEndDate)
            let dates = [];
            let months = new Set();
            let quarters = new Set();
            let currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate());
            let endDate = new Date(latestEndDate);
            endDate.setDate(endDate.getDate() + 1);
            while (currentDate < endDate) {
                let year = currentDate.getFullYear().toString().substr(-2); //获取最后两位年份
                let month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // 获取月份，加1并保证两位
                let date = currentDate.getDate().toString().padStart(2, "0"); // 获取日期并保证两位
                dates.push(`${year}-${month}-${date}`);
                months.add(month);
                const quarter = Math.ceil((currentDate.getMonth() + 1) / 3);
                quarters.add(quarter);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return dates;
        }, [startDate, latestEndDate]);

        // 缓存viemode
        useEffect(() => {
            localStorage.setItem('viewMode', viewMode);
        }, [viewMode]);

        const titleWidth = useMemo(() => {
            const boxc = document.querySelector(".boxc");
            if (boxc) {
                const containerWidth = boxc.offsetWidth;
                if (viewMode === "Days" && datesArray) {
                    const totalWidth = datesArray.length * 80;
                    // console.log(totalWidth)
                    if (totalWidth > containerWidth) {
                        document.documentElement.style.setProperty('--day-width', `80px`);
                        setDayWidth(80)
                        return 80;
                    } else {
                        // console.log(containerWidth / datesArray.length)
                        setDayWidth(containerWidth / datesArray.length)
                        return containerWidth / datesArray.length;
                    }
                }

            }
            return 80;
        }, [viewMode, datesArray, weeks]);

        const getWeekOffset = (startDate, currentDate) => {
            if (startDate && currentDate) {
                currentDate = new Date(currentDate); // 将字符串转换为Date对象
                startDate = new Date(startDate);
                const startDay = startDate.getDay();
                // const currentDay = currentDate.getDay();
                // console.log(startDate, startDay)
                // console.log(currentDate, currentDay)
                const diffTime = Math.abs(currentDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // console.log(diffDays);
                const leftOffset = diffDays + startDay - 1
                // console.log(leftOffset);
                return leftOffset;
            }
        };

        const getMonthOffset = (startDate, currentDate) => {
            if (startDate && currentDate) {
                currentDate = new Date(currentDate); // 将字符串转换为Date对象
                startDate = new Date(startDate);
                const startDayOfMonth = startDate.getDate();
                // const currentDayOfMonth = currentDate.getDate();
                // console.log(startDate, startDayOfMonth);
                // console.log(currentDate, currentDayOfMonth);
                const diffTime = Math.abs(currentDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // console.log(diffDays);
                const leftOffset = diffDays + startDayOfMonth
                // console.log(leftOffset);
                return leftOffset;
            }
        };

        const getQuarterOffset = (startDate, currentDate) => {
            if (startDate && currentDate) {
                startDate = new Date(startDate);
                const startmonth = startDate.getMonth();
                let quarterStartMonth;
                if (startmonth < 3) quarterStartMonth = 0;     // Q1: January, February, March
                else if (startmonth < 6) quarterStartMonth = 3; // Q2: April, May, June
                else if (startmonth < 9) quarterStartMonth = 6; // Q3: July, August, September
                else quarterStartMonth = 9;
                const quarterStartDate = new Date(startDate.getFullYear(), quarterStartMonth, 1);
                currentDate = new Date(currentDate); // 将字符串转换为Date对象


                const diffTime = Math.abs(currentDate - quarterStartDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return diffDays;
            }
        };


        const timeInterval = (start, end) => {
            const d1 = new Date(start);
            const d2 = new Date(end);
            const interval = d2.getTime() - d1.getTime() + 1;
            if (interval < 0) return 0;
            return Math.ceil(interval / 1000 / 60 / 60 / 24);
        };
        const timeInterval2 = (start, end) => {
            const d1 = new Date(start);
            const d2 = new Date(end);
            const interval = d2.getTime() - d1.getTime() + 1;
            if (interval < 0) return 0;
            return Math.ceil(interval / 1000 / 60 / 60 / 24);
        };

        // 搜索框
        const [searchTerm, setSearchTerm] = useState('');

        const handleChange = event => {
            setSearchTerm(event.target.value);
        };

        const handleSubmit = event => {
            event.preventDefault();
            if (searchTerm) {
                const filteredData = dataSource2.filter(item => {
                    console.log(item)
                    const keyMatches = item.key.toLowerCase().includes(searchTerm.toLowerCase());
                    const nameMatches = item.name.toLowerCase().includes(searchTerm.toLowerCase());
                    return keyMatches || nameMatches;
                });
                setDataSource(filteredData);
                const newRows = filteredData.map(item => ({
                    title: `${item.key} - ${item.name}`,
                    key: item.key,
                }));

                setRows(newRows);
            } else {
                forceUpdate();
            }
        };
        // 强制重新渲染整个页面
        const forceUpdate = () => {
            window.location.reload();
        };

        const [isEditing, setIsEditing] = useState(false);
        const [isokbtn, setisokbtn] = useState(false);
        const [activeButton, setActiveButton] = useState(null);
        const handleDoubleClick = (event, key, index) => {
            event.preventDefault();
            // console.log(`${key}_${index}`);
            setActiveButton(`${key}_${index}`);
            setIsEditing(true);
            // console.log("Clicked input box key:", key, "index:", index);
        };

        const cancelClick = (e, key, index) => {
            // 获取事件发生的目标元素
            const target = e.target;

            // 获取父元素
            const parentElement = target.parentNode;

            // 获取父元素的父元素
            const grandparentElement = parentElement.parentNode.parentNode.parentNode;

            // 获取父元素的子元素中的输入框
            const inputelement = grandparentElement.querySelector(".inputBox");
            inputelement.disabled = false;
            setInputValues(prevInputValues => {
                const updatedInputValues = {...prevInputValues};
                updatedInputValues[`${key}_${index}`] = '';
                return updatedInputValues;
            });

            // 输出子元素
            console.log("子元素列表：", inputelement);
            setActiveButton('');
            setShouldPreventBlur(false);
        };

        const okClick = (event, key, index) => {

            const value = inputValues[`${key}_${index}`];
            console.log("Clicked input box key:", key, "index:", index);
            console.log("Input box value:", value);
            setActiveButton("");
            setisokbtn('true')
            console.log('aaa', isokbtn)
            setShouldPreventBlur(false);
            event.target.disabled = false;
            if (value > 24) {
                setInputValues(prevInputValues => {
                    const updatedInputValues = {...prevInputValues};
                    updatedInputValues[`${key}_${index}`] = 24;
                    return updatedInputValues;
                });
            }

        }
        const [inputValues, setInputValues] = useState({});

        const handleInputChange = (event, key, index, value) => {
            if (isNaN(value)) {
                alert("Please enter a valid number.");
                event.target.value = '';
            } else {
                let formattedValue;
                if (Number.isInteger(parseFloat(value))) {
                    let parsedValue = parseFloat(value);
                    if (parsedValue > 24) {
                        parsedValue = 24;
                        event.target.value = '24.00';

                    }
                    formattedValue = parsedValue.toFixed(2);
                    console.log(formattedValue);
                }
                const updatedInputValues = {...inputValues}; // 创建新的对象
                updatedInputValues[`${key}_${index}`] = event.target.value; // 为特定的键赋予新的值
                setInputValues(updatedInputValues); // 使用新对象更新状态
            }
        };
        const [shouldPreventBlur, setShouldPreventBlur] = useState(false);

        const handleControlLeftMouseDown = (e) => {
            // 记录鼠标按下时的初始位置等信息
        };

        const handleControlRightMouseDown = (e) => {
            // 记录鼠标按下时的初始位置等信息
        };

        const handleMouseMove = (e) => {
            // 根据鼠标移动的距离和初始位置，计算应该改变的长度，并更新样式
        };

        const handleMouseUp = (e) => {
            // 停止拖动，清除事件监听
        };


        // 在TreeNode组件中，使用节点的height属性来设置节点的高度
        const TreeNode = ({node, level = 0}) => (
            <div
                key={node.key}
                className={`row_desc_container level_${level}`}
                style={{
                    height: `${node.height}px`,  // 使用节点的height属性
                    lineHeight: `60px`,
                    marginLeft: `${node.level * 20}px`,
                }}
            >

                <div className={`inline_boxex_${level}`}>
                    {level < 2 && <button className="expbutton"
                                          onClick={() => toggleExpand(node.key)}>{expandedKeys.includes(node.key) ? "-" : "+"}</button>}
                    {node.title}</div>
                {expandedKeys.includes(node.key) && node.children && node.children.map(child => <TreeNode key={`${node.key}_${level}`} node={child}
                                                                                                          level={level + 1}/>)}
            </div>
        );


        const [expandedKeys, setExpandedKeys] = useState([]);

        const toggleExpand = (key) => {
            setExpandedKeys((prevKeys) => {
                if (prevKeys.includes(key)) {
                    // 如果节点已经是展开的，那么我们把它从数组中移除
                    return prevKeys.filter((k) => k !== key);
                } else {
                    // 如果节点是折叠的，那么我们把它的key添加到数组中
                    return [...prevKeys, key];
                }
            });
        };
        const EffortNode = ({node, level = 0}) => (
            <div
                key={node.key}
                style={{
                    height: `${node.height}px`,  // 使用节点的height属性
                    lineHeight: `60px`,
                }}
            >
                <div className={`inline_effort_${level}`}>{node.count_effort}</div>
                {expandedKeys.includes(node.key) && node.children && node.children.map(child => <EffortNode key={`${node.key}_${level}`} node={child}
                                                                                                            level={level + 1}/>)}
            </div>
        );

        const ListNode = ({node, level = 0,index}) => (
            <div>
                <div
                    key={node.key}
                    className={`box_level_${level}`}
                    style={{
                        height: rowHeight,
                        lineHeight: `${rowHeight}px`,
                        width: datesArray.length * titleWidth,
                    }}
                >
                    {level >1 && ( <div
                        key={node.key}
                        // onMouseEnter={(e) => onMouseEnter(e, node)}
                        // onMouseLeave={onMouseLeave}
                        // onMouseMove={onMouseMove}
                        className={`line_level_${level}_type1`}

                        style={{
                            width: timeInterval2(node.start_time, node.end_time) * dayWidth,
                            // backgroundColor: "rgba(255,255,255,0)", // 默认颜色
                            height: 24,
                            position:"absolute",
                            left:`calc(${(timeInterval(startDate, node.start_time) - 1) * dayWidth}px)`,
                        }}
                    >
                            {[...Array(timeInterval2(node.start_time, node.end_time))].map((_, index) => (
                                <div className="inputcontainer">
                                    <input
                                        type="text"
                                        key={`${node.key}_${index}`}
                                        className={`inputBox`}
                                        value={inputValues[`${node.key}_${index}`]}
                                        // readOnly={!isEditing}
                                        onClick={(e) => handleDoubleClick(e, node.key, index)}
                                        onChange={(e) => handleInputChange(e, node.key, index, e.target.value)}
                                    />
                                    <div
                                        className={`buttonsContainer ${activeButton === `${node.key}_${index}` ? 'active' : 'disable'}`}>
                                        <div
                                            className={`btn ${activeButton === `${node.key}_${index}` ? 'active' : 'hidden'}`}
                                            onClick={(e) => okClick(e, node.key, index)}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 16 16" width="16"
                                                height="16">
                                                <cis-name>ok</cis-name>
                                                <rect opacity="0" width="16"
                                                      height="16"></rect>
                                                <path fill="#999999"
                                                      d="M2.46,9.64c-0.1-0.1-0.1-0.26,0-0.35l1.77-1.77c0.1-0.1,0.26-0.1,0.35,0l1.71,1.71  c0.1,0.1,0.26,0.1,0.35,0l5.71-5.71c0.1-0.1,0.26-0.1,0.35,0l1.77,1.77c0.1,0.1,0.1,0.26,0,0.35l-7.83,7.84  c-0.1,0.1-0.26,0.1-0.35,0L2.46,9.64z"></path>
                                            </svg>
                                        </div>
                                        <div
                                            className={`btn ${activeButton === `${node.key}_${index}` ? 'active' : 'hidden'}`}
                                            onClick={(e) => cancelClick(e, node.key, index)}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 16 16" width="16"
                                                height="16">
                                                <cis-name>remove</cis-name>
                                                <path fill="#999999" d="M12.82,11.04l-1.79,1.79c-0.1,0.1-0.26,0.1-0.36,0L8,10.15l-2.68,2.68c-0.1,0.1-0.26,0.1-0.36,0l-1.79-1.79
	c-0.1-0.1-0.1-0.26,0-0.36L5.85,8L3.18,5.32c-0.1-0.1-0.1-0.26,0-0.36l1.79-1.79c0.1-0.1,0.26-0.1,0.36,0L8,5.85l2.68-2.68
	c0.1-0.1,0.26-0.1,0.36,0l1.79,1.79c0.1,0.1,0.1,0.26,0,0.36L10.15,8l2.68,2.68C12.92,10.78,12.92,10.94,12.82,11.04z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                            ))}
                    </div>
                    )}
                </div>
                {expandedKeys.includes(node.key) && node.children && node.children.map((child, index) => (
                    <ListNode key={`${child.key}_${index}`} node={child} level={level + 1}/>
                ))}
            </div>
        );


        // useEffect(() => {
        //     console.log(rows)
        //     if (rows) {
        //         printRowsNodeLevel(rows);
        //     }
        //
        // }, [rows]);

        const printNodeLevel = (node, level) => {
            console.log("Node:", node);
            console.log("Level:", level);
        };

        const printRowsNodeLevel = (rows, level = 0) => {
            rows.forEach((row) => {
                printNodeLevel(row, level);
                if (row.children) {
                    printRowsNodeLevel(row.children, level + 1);
                }
            });
        };


        return (
            <>
                <div className="boxa">
                    <div className="titlea">
                        <img className="imga" src={ttImage} alt=""/>
                    </div>
                    <div className="boxb">
                        <div className="titleb">
                            <img className="imgb" src={mmImage} alt=""/>
                        </div>
                        <div className="boxc">
                            <div className="button-container">
                                <form onSubmit={handleSubmit} className="searchbox">
                                    <img
                                        src={iconImage13}
                                        alt="search"
                                        className="searchimg"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search Project ......"
                                        value={searchTerm}
                                        onChange={handleChange}
                                        className="searchinput"
                                    />
                                </form>
                            </div>
                            <div className="container_wrapper" style={{width}}>
                                <div className="container" style={{display: "block"}}>
                                    {/*标题tasklist*/}
                                    <div className="rowTitle" style={{width: 250}}>
                                        {rowTitle || null}
                                    </div>
                                    {/*标题totaleffort*/}
                                    <div className="rowTitle" style={{width: 100}}>
                                        {'Total Effort'}
                                    </div>
                                    {/*日期轴*/}
                                    <div
                                        className="header_container"
                                        ref={timeScrollRef}
                                        style={{
                                            marginLeft: 350
                                        }}
                                    >
                                        <div className="time_header_container">
                                            {viewMode === 'Days' &&
                                                datesArray.map((date, i) => (
                                                    <div key={i} className="time_header_item"
                                                         style={{width: titleWidth}}>
                                                        {date}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                    {/*taskslist 的内容*/}
                                    <div
                                        className="desc_container"
                                        onScroll={onScrollY}
                                        style={{height: bodyHeight, width: 250, display: "block"}}
                                    >
                                        {(rows ? rows : []).map(row => <TreeNode node={row}/>)}
                                    </div>
                                    {/*effortlist的内容*/}
                                    <div
                                        className="desc_container"
                                        onScroll={onScrollY}
                                        style={{height: bodyHeight, width: 100, display: "block"}}
                                    >
                                        {(rows ? rows : []).map(effort => <EffortNode node={effort}/>)}
                                    </div>
                                    {/*每一行的内容
                                    */}
                                    <div
                                        className="val_container"
                                        ref={valueScrollRef}
                                        onScroll={onScrollX}
                                        onWheel={onWheel}
                                        style={{height: bodyHeight, display: "block"}}
                                    >
                                        {(rows ? rows : []).map(row => <ListNode  node={row}/>)}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </>
        );
    }
;
export default GunttChart;

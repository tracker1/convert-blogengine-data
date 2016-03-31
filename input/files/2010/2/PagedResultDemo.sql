DROP TABLE MyList
GO

CREATE TABLE MyList (
    [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [created] DATETIME NOT NULL DEFAULT GETDATE(),
    [name] NVARCHAR(100) UNIQUE NOT NULL DEFAULT '',
    [description] NVARCHAR(250) UNIQUE NOT NULL DEFAULT ''
)
GO

INSERT INTO MyList VALUES (NEWID(), GETDATE()+0, 'first test', 'description for first test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+1, 'second test', 'description for second test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+2, 'third test', 'description for third test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+3, 'fourth test', 'description for fourth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+4, 'fifth test', 'description for fifth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+5, 'sixth test', 'description for sixth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+6, 'seventh test', 'description for seventh test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+7, 'eighth test', 'description for eighth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+8, 'ninth test', 'description for ninth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+9, 'tenth test', 'description for tenth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+10, 'eleventh test', 'description for eleventh test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+11, 'twelth test', 'description for twelth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+12, 'thirteenth test', 'description for thirteenth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+13, 'fourteenth test', 'description for fourteenth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+14, 'fifteenth test', 'description for fifteenth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+15, 'sixteenth test', 'description for sixteenth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+16, 'seventeenth test', 'description for seventeenth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+17, 'eighteenth test', 'description for eighteenth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+18, 'nineteenth test', 'description for nineteenth test');
INSERT INTO MyList VALUES (NEWID(), GETDATE()+19, 'twentieth test', 'description for twentieth test');
GO

DROP PROCEDURE [Get_MyList_Paged]
GO

CREATE PROCEDURE [Get_MyList_Paged]
    /*Paging Inputs*/
    @Page_Size INT = 100,
    @Page_Number INT = 1,
    @Sort_Column VARCHAR(100),  /* ('created','name','description') */
    @Sort_Direction VARCHAR(4), /* ('ASC','DESC') */
    
    /*Paging Total For Output*/
    @Row_Count BIGINT OUT,
    
    /*Result Filters*/
    @id UNIQUEIDENTIFIER,
    @created_filter VARCHAR(2),   /* ('ne','g','ge','e','le','l') */
    @created_date DATETIME,
    @name NVARCHAR(100),
    @description NVARCHAR(500)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
    -- interfering with SELECT statements.
    SET NOCOUNT ON;

    /*========================================================================
    Declare local variables
    ========================================================================*/
	DECLARE @FirstRecord int
    DECLARE @LastRecord int

	-- create a temporary space for paged result set
    DECLARE @PagedResults AS TABLE (
		[id] UNIQUEIDENTIFIER,
		[created] DATETIME,
		[name] NVARCHAR(100),
		[description] NVARCHAR(500),
		[Row_Number] BIGINT,
		[Row_Count] BIGINT
    );
    
    /*========================================================================
    Normalize Paging Parameters
    ========================================================================*/
    	--Fix invalid input for Page Size
    SET @Page_Size = CASE 
        WHEN @Page_Size IS NULL THEN 100
        WHEN @Page_Size < 1 THEN 100
        ELSE @Page_Size
    END;

    --Fix invalid input for Page Number
    SET @Page_Number = CASE
        WHEN @Page_Number IS NULL THEN 1
        WHEN @Page_Number < 1 THEN 1
        ELSE @Page_Number
    END;

	--starting record to use.
	SET @FirstRecord = ((@Page_Number - 1) * @Page_Size) + 1

	--last record to use.
	SET @LastRecord = @FirstRecord + @Page_Size - 1

	--ensure sort column is valid in the list
    SET @Sort_Column = CASE
        WHEN LOWER(@Sort_Column) IN ('created','name','description')
			THEN LOWER(@Sort_Column)
		ELSE
			'created' --default
    END
    
    --ensure sort direction is ASC or DESC
	SET @Sort_Direction = CASE
		WHEN LEFT(UPPER(COALESCE(@Sort_Direction, '')) + '    ', 4) = 'DESC' 
			THEN 'DESC' --explicit descending
		WHEN @Sort_Column = 'created' AND LEFT(UPPER(COALESCE(@Sort_Direction,'')) + '   ', 3) <> 'ASC' THEN
			'DESC' --default for created date
		ELSE 'ASC' --default otherwise
	END;

    
    /*========================================================================
    Normalize Filter Parameters
    ========================================================================*/
	--ensure that id is a valid non-default guid, or null
    SET @id = CASE @id
	    WHEN '00000000-0000-0000-0000-000000000000' THEN null
		ELSE @id
	END;
	
	--When an id is specified, only search on the id
	IF (@id IS NOT NULL)
	BEGIN
	    --set all other input filters to null
		SET @created_filter = null
		SET @created_date = null
		SET @name = null
		SET @description = null
	END
	ELSE
	BEGIN
	    --validate other input filters
		
		-- @created_date
		SET @created_date = DATEADD(dd, 0, DATEDIFF(dd, 0, @created_date))
		
		-- @created_filter
		SET @created_filter = CASE
			WHEN LOWER(@created_filter) in ('ne','g','ge','e','le','l') THEN
				LOWER(@created_filter)
			ELSE
				null
		END;
		
		-- created filtering needs a date and a filter
		IF (@created_filter IS NULL OR @created_date IS NULL)
		BEGIN
			SET @created_date = null
			SET @created_filter = null
		END;
		
		
		-- @name - if it's an empty string, make it null
		SET @name = CASE 
			WHEN COALESCE(LTRIM(RTRIM(@name)), '') = ''
				THEN null
			ELSE
				LTRIM(RTRIM(@name))
		END;
		
		
		-- @description - if it's an empty string, make it null
		SET @description = CASE 
			WHEN COALESCE(LTRIM(RTRIM(@description)), '') = ''
				THEN null
			ELSE
				LTRIM(RTRIM(@description))
		END;

	END;

    
    /*========================================================================
    Prepare Results
    ========================================================================*/
    WITH [MyTempArea] AS (
		SELECT TOP (@LastRecord)
			[id],
			[created],
			[name],
			[description],
			ROW_NUMBER() OVER (
				ORDER BY
					CASE WHEN(@Sort_Direction = 'ASC') THEN CASE WHEN @Sort_Column='created'		THEN [created] END END ASC,
					CASE WHEN(@Sort_Direction = 'ASC') THEN CASE WHEN @Sort_Column='name'			THEN [name] END END ASC,
					CASE WHEN(@Sort_Direction = 'ASC') THEN CASE WHEN @Sort_Column='description'	THEN [description] END END ASC,
					CASE WHEN(@Sort_Direction = 'DESC') THEN CASE WHEN @Sort_Column='created'		THEN [created] END END DESC,
					CASE WHEN(@Sort_Direction = 'DESC') THEN CASE WHEN @Sort_Column='name'			THEN [name] END END DESC,
					CASE WHEN(@Sort_Direction = 'DESC') THEN CASE WHEN @Sort_Column='description'	THEN [description] END END DESC
			) AS [Row_Number],
			COUNT(*) OVER () AS [Row_Count]
		FROM
			MyList
		WHERE
			[id] = COALESCE(@id, [id])
			AND (
				@name is null
				OR	
				@name like '%' + COALESCE(@name, [name]) + '%'
			)
			AND (
				@description is null
				OR
				@description like '%' + COALESCE(@description, [description]) + '%'
			)
			AND (
				@created_filter is null
				OR ( @created_filter = 'ne' AND [created] < @created_date AND [created] >= (@created_date + 1) ) 
				OR ( @created_filter = 'g' AND [created] > (@created_date + 1) ) 
				OR ( @created_filter = 'ge' AND [created] >= @created_date ) 
				OR ( @created_filter = 'e' AND [created] >= @created_date AND [created] < (@created_date + 1) )
				OR ( @created_filter = 'le' AND [created] < (@created_date + 1) )
				OR ( @created_filter = 'l' AND [created] < @created_date )
			)
    )
	INSERT INTO @PagedResults
	SELECT * FROM [MyTempArea] WHERE [Row_Number] >= @FirstRecord;
    
    /*========================================================================
    Return Results
    ========================================================================*/
	-- @Row_Count output param
	SELECT @Row_Count = COALESCE(MAX(Row_Count), 0) FROM @PagedResults;

	-- Paged results set to return
	SELECT	
			[id]
			,[created]
			,[name]
			,[description]
	FROM @PagedResults
	ORDER BY [Row_Number];
END
GO


/**

		DECLARE @RC int
		DECLARE @Page_Size int
		DECLARE @Page_Number int
		DECLARE @Sort_Column varchar(100)
		DECLARE @Sort_Direction varchar(4)
		DECLARE @Row_Count bigint
		DECLARE @id uniqueidentifier
		DECLARE @created_filter VARCHAR(2)
		DECLARE @created_date datetime
		DECLARE @name nvarchar(100)
		DECLARE @description nvarchar(500)

		-- TODO: Set parameter values here.
		SET @Page_Size = 5
		SET @Page_Number = 1
		SET @Sort_Column = 'created'
		SET @Sort_Direction = 'ASC'
		SET @created_filter = 'e'
		SET @created_date = '2010-02-26'

		EXECUTE @RC = [SI_ART].[dbo].[Get_MyList_Paged] 
		   @Page_Size
		  ,@Page_Number
		  ,@Sort_Column
		  ,@Sort_Direction
		  ,@Row_Count OUTPUT
		  ,@id
		  ,@created_filter
		  ,@created_date
		  ,@name
		  ,@description

		SELECT @Row_Count AS [Row_Count];


**/